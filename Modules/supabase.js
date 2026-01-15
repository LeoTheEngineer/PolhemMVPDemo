const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const Bottleneck = require('bottleneck');

// Load environment variables
dotenv.config();

// Supabase client
let supabase = null;

function getSupabaseClient() {
    if (!supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SECRET;
        
        if (!supabaseUrl) {
            console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
            throw new Error('Supabase configuration incomplete. Set NEXT_PUBLIC_SUPABASE_URL in .env.local');
        }
        
        if (!supabaseKey) {
            console.error('Missing SUPABASE_SECRET environment variable');
            throw new Error('Supabase configuration incomplete. Set SUPABASE_SECRET in .env.local');
        }
        
        if (process.env.NODE_ENV !== 'production') {
            console.log('Supabase URL:', supabaseUrl ? 'Loaded' : 'UNDEFINED');
            console.log('Supabase Key:', supabaseKey ? 'Loaded' : 'UNDEFINED');
        }
        
        supabase = createClient(supabaseUrl, supabaseKey);
    }
    return supabase;
}

function generateSupabaseRowId() {
    const uuid = uuidv4();
    const hexString = uuid.replace(/-/g, '').substring(0, 16);
    
    // Convert to BigInt, ensuring the first bit is 0 (positive number)
    let num = BigInt('0x' + hexString);
    num = num & ~(BigInt(1) << BigInt(63));  // Clear the most significant bit
    
    // Return as string
    return num.toString();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a rate limiter using Bottleneck
 * @param {number} maxConcurrent - Maximum concurrent requests
 * @param {number} minDelay - Minimum time between request starts (ms)
 * @param {number} maxRequests - Optional: max requests per period
 * @param {number} perTimeUnit - Time period for maxRequests (ms)
 * @returns {Bottleneck} Configured Bottleneck limiter
 */
function createLimiter(maxConcurrent, minDelay, maxRequests, perTimeUnit) {
    const limiter = new Bottleneck({
        maxConcurrent: maxConcurrent,        // Max concurrent requests
        minTime: minDelay,                   // Minimum time between request starts (ms)
        reservoir: maxRequests,              // Optional: max requests per period
        reservoirRefreshAmount: maxRequests,
        reservoirRefreshInterval: perTimeUnit
    });
    return limiter;
}



// Row operations
async function createRow(table, id = null, data = null) {
    const supabase = getSupabaseClient();
    if (!id) {
        id = generateSupabaseRowId();
    }
    let { data: rows, error } = await supabase.from(table).insert({ "id": id, ...(data != null && data) });
    if (error != null) {
        console.log("Error inserting " + table + " " + id + ": ", error);
        return null
    }
    return id;
}

async function insertRows(table, ids) {
    if (!ids || ids.length === 0) {
        console.log(`insertRows: No IDs provided for table ${table}`);
        return { success: [], failed: [] };
    }
    const supabase = getSupabaseClient();
    const timestamp = new Date().toISOString();
    const CHUNK_SIZE = 100;
    const chunks = [];
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        chunks.push(ids.slice(i, i + CHUNK_SIZE));
    }
    
    const failedIds = [];
    const results = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`insertRows: Processing chunk ${i + 1}/${chunks.length} with ${chunk.length} IDs`);
        let tries = 0;
        const maxTries = 2;
        let chunkSuccess = false;
        
        while (tries < maxTries && !chunkSuccess) {
            try {
                const { data, error } = await supabase.from(table).upsert(
                    chunk.map((id) => ({
                        "id": id,
                        "created_at": timestamp
                    }))
                ).select();
                if (error) {
                    throw error;
                }
                if (data && Array.isArray(data)) {
                    // Store the returned objects for this chunk
                    results.push(...data);
                }
                chunkSuccess = true;
            } catch (err) {
                tries++;
                console.error(`insertRows: Error processing chunk ${i + 1} (attempt ${tries}):`, err);
                if (tries < maxTries) {
                    const delay = Math.pow(2, tries - 2) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // Add all IDs from this failed chunk to failedIds
                    failedIds.push(...chunk);
                    console.error(`insertRows: Chunk ${i + 1} failed after ${maxTries} attempts. Failed IDs:`, chunk);
                }
            }
        }
    }

    console.log(`insertRows: Completed. Inserted ${results.length} rows, ${failedIds.length} failed IDs`);

    if (failedIds.length > 0) {
        console.warn(`insertRows: Failed IDs: ${failedIds.join(', ')}`);
    }

    return {
        success: results,
        failed: failedIds,
        errors: failedIds.map(id => ({ id, error: 'Chunk failed after retries' }))
    };
}

async function readRowCols(table, id, cols) {
    const supabase = getSupabaseClient();
    let { data: rows, error } = await supabase.from(table).select(cols).eq("id", id);
    if (error != null) {
        console.log("Error reading " + table + " row " + id + ": ", error);
        return { success: null, failed: [id], errors: [{ id, error: error.message || error }] };
    }
    if (rows == null || rows.length == 0) {
        console.log("No existing " + table + " row for: ", id);
        return { success: null, failed: [id], errors: [{ id, error: 'Row not found' }] };
    }
    return { success: rows[0], failed: [], errors: [] };
}

async function readRowsBatch(table, ids, cols = "*") {
    if (!ids || ids.length === 0) {
        console.log("readRowsBatch: No IDs provided");
        return [];
    }

    // Remove duplicates and filter out null/undefined values
    const uniqueIds = [...new Set(ids.filter(id => id != null))];
    
    if (uniqueIds.length === 0) {
        console.log("readRowsBatch: No valid IDs after filtering");
        return [];
    }

    console.log(`readRowsBatch: Processing ${uniqueIds.length} unique IDs for table ${table}`);
    
    const CHUNK_SIZE = 100;
    const chunks = [];
    
    // Create chunks
    for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
        chunks.push(uniqueIds.slice(i, i + CHUNK_SIZE));
    }

    const supabase = getSupabaseClient();
    
    // Process all chunks in parallel for maximum speed
    const chunkPromises = chunks.map(async (chunk, index) => {
        console.log(`readRowsBatch: Processing chunk ${index + 1}/${chunks.length} with ${chunk.length} IDs`);
        
        let tries = 0;
        const maxTries = 3;
        while (tries < maxTries) {
            try {
                const { data: rows, error } = await supabase
                    .from(table)
                    .select(cols)
                    .in('id', chunk);
                
                if (error) {
                    throw error;
                }
                
                if (rows && Array.isArray(rows)) {
                    console.log(`readRowsBatch: Successfully read ${rows.length} rows from chunk ${index + 1}`);
                    return { success: true, chunkIndex: index, rows };
                }
                
                return { success: false, chunkIndex: index, error: 'Invalid response format', rows: [] };
                
            } catch (chunkError) {
                tries++;
                console.error(`readRowsBatch: Exception processing chunk ${index + 1} (attempt ${tries}):`, chunkError);
                if (tries < maxTries) {
                    const delay = Math.pow(2, tries - 2) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    return { success: false, chunkIndex: index, error: chunkError.message, rows: [] };
                }
            }
        }
    });

    // Wait for all chunks to complete
    const results = await Promise.all(chunkPromises);
    
    // Combine all successful results
    const allRows = [];
    const errors = [];
    
    for (const result of results) {
        if (result.success) {
            allRows.push(...result.rows);
        } else {
            errors.push({ chunkIndex: result.chunkIndex, error: result.error });
        }
    }

    // Create a map for efficient lookup
    const rowMap = new Map(allRows.map(row => [row.id, row]));

    // Return rows in the same order as original ids, with null for missing rows
    const finalResult = ids.map(id => {
        if (id == null) return null;
        return rowMap.get(id) || null;
    });

    console.log(`readRowsBatch: Completed. Found ${allRows.length} rows, ${errors.length} chunk errors`);
    
    if (errors.length > 0) {
        console.warn("readRowsBatch: Some chunks failed:", errors);
    }

    return { 
        success: finalResult, 
        failed: [], 
        errors: errors.map(e => ({ chunkIndex: e.chunkIndex, error: e.error })) 
    };
}

async function readAllRowsCols(table, cols,
    {
        orderCol = 'id',   // the column you want to sort by
        asc = true,   // ascending or descending
        filterCols = [],     // [{col, value}, ...] for eq
        arrayFilterCols = [],     // [{col, values}, ...] for IN
        notFilters = [],    // [{col, method, value}, ...] for NOT
        testing = false,
        maxRows = null,  // optional limit on total rows to fetch
    } = {}, logs = true
) {
    const MAX_FILTER_LENGTH = 500;
    let longArrayFilters = arrayFilterCols.filter((filter) => filter.values && filter.values.length > MAX_FILTER_LENGTH);
    let shortArrayFilters = arrayFilterCols.filter((filter) => filter.values && filter.values.length <= MAX_FILTER_LENGTH);

    const limit = 1000;
    const supabase = getSupabaseClient();

    if (logs) {
        console.log(`readAllRowsCols: Starting to read from table ${table}`);
        console.log(`readAllRowsCols: Filters - ${filterCols.length} eq, ${shortArrayFilters.length} short array, ${longArrayFilters.length} long array`);
    }

    // SEQUENTIAL PAGINATION MODE
    let allRows = [];
    let lastValue = null;
    let lastId = null;
    let pageCount = 0;
    const maxPages = 1000;

    while (pageCount < maxPages) {
        try {
            pageCount++;

            let query = supabase.from(table).select(cols);

            // 1) apply simple eq-filters
            for (const filter of filterCols) {
                if (filter && filter.col && filter.value !== undefined) {
                    query = query.eq(filter.col, filter.value);
                }
            }

            // 2) apply array filters (short ones)
            for (const filter of shortArrayFilters) {
                if (filter && filter.col && filter.values && filter.values.length > 0) {
                    query = query.in(filter.col, filter.values);
                }
            }

            // 3) apply not filters
            for (const filter of notFilters) {
                if (filter && filter.col && filter.method === "is") {
                    query = query.is(filter.col, filter.value);
                }
            }

            // 4) apply ordering
            if (asc) {
                query = query.order(orderCol, { ascending: true });
            } else {
                query = query.order(orderCol, { ascending: false });
            }

            // 5) apply pagination
            if (lastValue !== null) {
                if (asc) {
                    query = query.gt(orderCol, lastValue);
                } else {
                    query = query.lt(orderCol, lastValue);
                }
            }

            // 6) apply limit
            query = query.limit(limit);

            // 7) execute query
            let tries = 0;
            const maxTries = 3;
            let rows, error;
            while (tries < maxTries) {
                let result;
                try {
                    result = await query;
                    rows = result.data;
                    error = result.error;
                    if (error != null) {
                        // Handle both error objects and error strings
                        const errorMessage = error?.message || error?.toString?.() || JSON.stringify(error) || 'Unknown error';
                        throw new Error(`Query error: ${errorMessage}`);
                    }
                    break;
                } catch (pageError) {
                    tries++;
                    console.error(`readAllRowsCols: Exception on page ${pageCount} (attempt ${tries}):`, pageError);
                    if (tries < maxTries) {
                        const delay = Math.pow(2, tries - 2) * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        break;
                    }
                }
            }

            if (!rows || rows.length === 0) {
                if (logs) console.log(`readAllRowsCols: No more rows found on page ${pageCount}`);
                break;
            }

            // Store original row count for pagination check
            const originalRowCount = rows.length;

            // If we have long array filters, don't filter yet (do it at the end for performance)
            // Otherwise, we can safely add rows and check maxRows inside the loop
            allRows.push(...rows);

            if (logs) {
                console.log(`readAllRowsCols: Page ${pageCount} - Read ${originalRowCount} rows, Total: ${allRows.length}`);
            }

            // Check if we've reached maxRows limit (only when NO long filters, otherwise check at end)
            if (longArrayFilters.length === 0 && maxRows !== null && allRows.length >= maxRows) {
                if (logs) console.log(`readAllRowsCols: Reached maxRows limit (${maxRows}), stopping`);
                allRows = allRows.slice(0, maxRows); // Trim to exact limit
                break;
            }

            // Check if this is the last page
            if (originalRowCount < limit) {
                if (logs) console.log(`readAllRowsCols: Last page reached (${originalRowCount} rows fetched < ${limit} limit)`);
                break;
            }

            // Update pagination values for next iteration
            const lastRow = rows[rows.length - 1];
            if (!lastRow || lastRow[orderCol] === undefined) {
                console.error(`readAllRowsCols: Invalid last row or missing orderCol ${orderCol}`);
                break;
            }

            lastValue = lastRow[orderCol];
            lastId = lastRow.id;

            if (lastValue === null || lastValue === undefined) {
                console.error(`readAllRowsCols: Invalid lastValue for pagination`);
                break;
            }

        } catch (pageError) {
            console.error(`readAllRowsCols: Exception on page ${pageCount}:`, pageError);
            break;
        }
    }

    if (pageCount >= maxPages) {
        console.warn(`readAllRowsCols: Reached maximum page limit (${maxPages}), stopping`);
    }

    // Apply long array filters ONCE at the end (much faster than per-chunk)
    if (longArrayFilters.length > 0) {
        const beforeFilterCount = allRows.length;
        for (const filter of longArrayFilters) {
            if (filter && filter.col && filter.values) {
                allRows = allRows.filter((row) => filter.values.includes(row[filter.col]));
            }
        }
        if (logs) {
            console.log(`readAllRowsCols: Applied long array filters - ${beforeFilterCount} rows → ${allRows.length} rows`);
        }

        // Apply maxRows limit AFTER filtering (only needed when we have long filters)
        if (maxRows !== null && allRows.length > maxRows) {
            if (logs) console.log(`readAllRowsCols: Trimming to maxRows limit (${maxRows})`);
            allRows = allRows.slice(0, maxRows);
        }
    }

    if (logs) {
        console.log(`readAllRowsCols: Completed. Total rows: ${allRows.length}, Pages: ${pageCount}`);
    }

    return {
        success: allRows,
        failed: [],
        errors: []
    };
}

async function readAllRowsColsSingle(table, cols) {
    const supabase = getSupabaseClient();
    let { data: rows, error } = await supabase.from(table).select(cols);
    if (error!=null) {
      console.log("Error reading " + table + " row : ", error);
      return { success: null, failed: ['unknown'], errors: [{ id: 'unknown', error: error.message || error }] };
    }
    if (rows==null || rows.length==0) {
      console.log("No existing " + table + " row for: ", table);
      return { success: [], failed: [], errors: [] };
    }
    return { success: rows, failed: [], errors: [] };
}

async function updateRow(table, id, data) {
    const supabase = getSupabaseClient();
    let { data: rows, error } = await supabase.from(table).update(data).eq("id", id);
    if (error != null) {
        console.log("Error updating " + table + " row " + id + ": ", error);
        return { success: null, failed: [id], errors: [{ id, error: error.message || error }] };
    }
    return { success: rows, failed: [], errors: [] };
}


async function upsertRows(table, rows) {
    if (!rows || rows.length === 0) {
        console.log(`upsertRows: No rows provided for table ${table}`);
        return { success: [], failed: [] };
    }

    // Remove duplicates based on id and filter out invalid rows
    const validRows = rows.filter(row => row && row.id != null);
    const uniqueRows = [];
    const seenIds = new Set();
    
    for (const row of validRows) {
        if (!seenIds.has(row.id)) {
            seenIds.add(row.id);
            uniqueRows.push(row);
        }
    }

    if (uniqueRows.length === 0) {
        console.log(`upsertRows: No valid rows after filtering for table ${table}`);
        return { success: [], failed: [] };
    }

    console.log(`upsertRows: Processing ${uniqueRows.length} unique rows for table ${table}`);
    
    const CHUNK_SIZE = 250;
    const chunks = [];
    
    // Create chunks
    for (let i = 0; i < uniqueRows.length; i += CHUNK_SIZE) {
        chunks.push(uniqueRows.slice(i, i + CHUNK_SIZE));
    }

    const supabase = getSupabaseClient();
    
    // Process all chunks sequentially for lower load
    const results = [];
    const failedIds = [];
    const allErrors = [];
    
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`upsertRows: Processing chunk ${i + 1}/${chunks.length} with ${chunk.length} rows`);
        let tries = 0;
        const maxTries = 3;
        let chunkSuccess = false;
        let lastError = null;
        
        while (tries < maxTries && !chunkSuccess) {
            try {
                const { data, error } = await supabase.from(table).upsert(chunk, {
                    onConflict: 'id',
                    ignoreDuplicates: false
                }).select();
                if (error) {
                    throw error;
                }
                if (data && Array.isArray(data)) {
                    console.log(`upsertRows: Successfully upserted ${data.length} rows from chunk ${i + 1}`);
                    results.push({ success: true, chunkIndex: i, data });
                    chunkSuccess = true;
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (chunkError) {
                lastError = chunkError;
                tries++;
                console.error(`upsertRows: Exception processing chunk ${i + 1} (attempt ${tries}):`, chunkError);
                console.error(`upsertRows: Error details - message:`, chunkError.message);
                console.error(`upsertRows: Error details - code:`, chunkError.code);
                console.error(`upsertRows: Error details - details:`, chunkError.details);
                console.error(`upsertRows: Error details - hint:`, chunkError.hint);
                console.error(`upsertRows: Error details - stack:`, chunkError.stack);
                console.error(`upsertRows: Chunk data sample:`, JSON.stringify(chunk.slice(0, 2), null, 2));
                if (tries < maxTries) {
                    const delay = Math.pow(2, tries - 2) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // Add all IDs from this failed chunk to failedIds
                    const chunkIds = chunk.map(row => row.id);
                    failedIds.push(...chunkIds);
                    // Store detailed error information for each failed ID
                    chunkIds.forEach(id => {
                        allErrors.push({ 
                            id, 
                            error: lastError.message || 'Unknown error',
                            code: lastError.code,
                            details: lastError.details,
                            hint: lastError.hint
                        });
                    });
                    console.error(`upsertRows: Chunk ${i + 1} failed after ${maxTries} attempts. Failed IDs:`, chunkIds);
                }
            }
        }
    }

    // Combine all successful results
    const allResults = [];
    
    for (const result of results) {
        if (result.success) {
            allResults.push(...result.data);
        }
    }

    console.log(`upsertRows: Completed. Upserted ${allResults.length} rows, ${failedIds.length} failed IDs`);
    
    if (failedIds.length > 0) {
        console.warn(`upsertRows: Failed IDs: ${failedIds.join(', ')}`);
    }

    return { 
        success: allResults, 
        failed: failedIds,
        errors: allErrors 
    };
}

async function deleteRow(table, id) {
    const supabase = getSupabaseClient();
    let { data, error } = await supabase.from(table).delete().eq("id", id);
    if (error != null) {
        console.log("Error deleting " + table + " row " + id + ": ", error);
        return null;
    }
    return data;
}

async function deleteRows(table, ids, deleteBy = "id") {
    if (!ids || ids.length === 0) {
        console.log(`deleteRows: No IDs provided for table ${table}`);
        return { deleted: 0, errors: [] };
    }

    // Remove duplicates and filter out null/undefined values
    const uniqueIds = [...new Set(ids.filter(id => id != null))];
    
    if (uniqueIds.length === 0) {
        console.log(`deleteRows: No valid IDs after filtering for table ${table}`);
        return { deleted: 0, errors: [] };
    }

    console.log(`deleteRows: Processing ${uniqueIds.length} unique IDs for table ${table}`);
    
    // Batch size: 100 is a good balance between speed and timeout risk
    // After adding indexes on foreign key columns, this should be fast
    // If you get timeouts, reduce to 50. If it's fast, try increasing to 200.
    const CHUNK_SIZE = 100;
    const chunks = [];

    // Create chunks and sort IDs for consistent ordering (prevents deadlocks)
    for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
        const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
        chunk.sort();
        chunks.push(chunk);
    }

    const supabase = getSupabaseClient();

    // Process all chunks sequentially with enhanced retry logic
    const results = [];
    const failedIds = [];
    const allErrors = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`deleteRows: Processing chunk ${i + 1}/${chunks.length} with ${chunk.length} IDs`);

        let tries = 0;
        const maxTries = 3;
        let success = false;
        let lastError = null;

        while (tries < maxTries && !success) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .delete()
                    .in(deleteBy, chunk);

                if (error) {
                    // Check if it's a deadlock error
                    if (error.code === '40P01') {
                        console.warn(`deleteRows: Deadlock detected on chunk ${i + 1}, attempt ${tries + 1}. Retrying with longer delay...`);
                        // Use longer delay for deadlock errors
                        const deadlockDelay = Math.pow(2, tries) * 1000;
                        await delay(deadlockDelay);
                    } else {
                        throw error;
                    }
                } else {
                    const deletedCount = data ? data.length : chunk.length;
                    console.log(`deleteRows: Successfully deleted ${deletedCount} rows from chunk ${i + 1}`);
                    results.push({ success: true, chunkIndex: i, deleted: deletedCount });
                    success = true;
                }
            } catch (chunkError) {
                lastError = chunkError;
                tries++;
                console.error(`deleteRows: Exception on attempt ${tries} for chunk ${i + 1}:`, chunkError);

                if (tries < maxTries) {
                    const baseDelay = Math.pow(2, tries) * 1000;
                    const jitter = Math.random() * 1000;
                    const delayTime = baseDelay + jitter;

                    console.log(`deleteRows: Retrying chunk ${i + 1} in ${Math.round(delayTime)}ms (attempt ${tries + 1}/${maxTries})`);
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                } else {
                    console.error(`deleteRows: Chunk ${i + 1} failed after ${maxTries} attempts`);
                    results.push({ success: false, chunkIndex: i, error: lastError.message, deleted: 0 });

                    // Track failed IDs and their errors
                    failedIds.push(...chunk);
                    chunk.forEach(id => {
                        allErrors.push({
                            id,
                            error: lastError.message || 'Unknown error',
                            code: lastError.code,
                            details: lastError.details
                        });
                    });
                }
            }
        }

        // No delay between successful chunks - let database handle the load
    }

    // Combine all results
    let totalDeleted = 0;
    const errors = [];
    
    for (const result of results) {
        if (result.success) {
            totalDeleted += result.deleted;
        } else {
            errors.push({ 
                chunkIndex: result.chunkIndex, 
                error: result.error 
            });
        }
    }

    console.log(`deleteRows: Completed. Deleted ${totalDeleted} rows, ${errors.length} chunk errors`);
    
    if (errors.length > 0) {
        console.warn("deleteRows: Some chunks failed:", errors);
    }

    return { 
        deleted: totalDeleted, 
        failed: failedIds, 
        errors: allErrors 
    };
}


/**
 * Read settings from the monolith settings table (single row with id='main')
 * @returns {Promise<{success: object|null, failed: array, errors: array}>}
 */
async function readSettings() {
    const supabase = getSupabaseClient();
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 'main')
            .single();

        if (error) {
            console.log("Error reading settings: ", error);
            return { success: null, failed: ['main'], errors: [{ id: 'main', error: error.message || error }] };
        }

        if (!data) {
            console.log("No settings row found");
            return { success: null, failed: ['main'], errors: [{ id: 'main', error: 'Settings row not found' }] };
        }

        return { success: data, failed: [], errors: [] };
    } catch (err) {
        console.error("Exception reading settings:", err);
        return { success: null, failed: ['main'], errors: [{ id: 'main', error: err.message || err }] };
    }
}

/**
 * Update settings in the monolith settings table (single row with id='main')
 * @param {object} data - Settings fields to update (do not include 'id' or 'created_at')
 * @returns {Promise<{success: object|null, failed: array, errors: array}>}
 */
async function updateSettings(data) {
    const supabase = getSupabaseClient();
    try {
        // Remove id and created_at from update payload if present
        const { id, created_at, ...updateData } = data;

        const { data: result, error } = await supabase
            .from('settings')
            .update(updateData)
            .eq('id', 'main')
            .select()
            .single();

        if (error) {
            console.log("Error updating settings: ", error);
            return { success: null, failed: ['main'], errors: [{ id: 'main', error: error.message || error }] };
        }

        return { success: result, failed: [], errors: [] };
    } catch (err) {
        console.error("Exception updating settings:", err);
        return { success: null, failed: ['main'], errors: [{ id: 'main', error: err.message || err }] };
    }
}

// ============================================
// POLHEM MVP SPECIFIC FUNCTIONS
// RPC wrappers for SQL functions defined in SQL/functions.sql
// ============================================

/**
 * Get total order quantity within a date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string|null} productId - Optional product UUID filter
 * @param {string|null} customerId - Optional customer UUID filter
 * @param {string|null} status - Optional status filter ('pending', 'scheduled', 'in_production', 'completed', 'cancelled')
 * @returns {Promise<{success: object|null, failed: array, errors: array}>}
 */
async function getOrdersQuantityByDateRange(startDate, endDate, productId = null, customerId = null, status = null) {
    const supabase = getSupabaseClient();
    try {
        const { data, error } = await supabase.rpc('get_orders_quantity_by_date_range', {
            p_start_date: startDate,
            p_end_date: endDate,
            p_product_id: productId,
            p_customer_id: customerId,
            p_status: status
        });

        if (error) {
            console.log("Error in getOrdersQuantityByDateRange:", error);
            return { success: null, failed: [], errors: [{ error: error.message || error }] };
        }

        return { success: data && data[0] ? data[0] : { total_quantity: 0, order_count: 0 }, failed: [], errors: [] };
    } catch (err) {
        console.error("Exception in getOrdersQuantityByDateRange:", err);
        return { success: null, failed: [], errors: [{ error: err.message || err }] };
    }
}

/**
 * Get total production quantity within a time range
 * @param {string} startTime - Start timestamp (ISO format)
 * @param {string} endTime - End timestamp (ISO format)
 * @param {string|null} productId - Optional product UUID filter
 * @param {string|null} machineId - Optional machine UUID filter
 * @param {string|null} customerId - Optional customer UUID filter
 * @returns {Promise<{success: object|null, failed: array, errors: array}>}
 */
async function getProductionQuantityByTimeRange(startTime, endTime, productId = null, machineId = null, customerId = null) {
    const supabase = getSupabaseClient();
    try {
        const { data, error } = await supabase.rpc('get_production_quantity_by_time_range', {
            p_start_time: startTime,
            p_end_time: endTime,
            p_product_id: productId,
            p_machine_id: machineId,
            p_customer_id: customerId
        });

        if (error) {
            console.log("Error in getProductionQuantityByTimeRange:", error);
            return { success: null, failed: [], errors: [{ error: error.message || error }] };
        }

        return { success: data && data[0] ? data[0] : { total_quantity: 0, block_count: 0, total_production_minutes: 0 }, failed: [], errors: [] };
    } catch (err) {
        console.error("Exception in getProductionQuantityByTimeRange:", err);
        return { success: null, failed: [], errors: [{ error: err.message || err }] };
    }
}

/**
 * Calculate machine OEE (Overall Equipment Effectiveness) for a specific date
 * @param {string} machineId - Machine UUID
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<{success: object|null, failed: array, errors: array}>}
 */
async function getMachineOEE(machineId, date) {
    const supabase = getSupabaseClient();
    try {
        const { data, error } = await supabase.rpc('get_machine_oee', {
            p_machine_id: machineId,
            p_date: date
        });

        if (error) {
            console.log("Error in getMachineOEE:", error);
            return { success: null, failed: [machineId], errors: [{ id: machineId, error: error.message || error }] };
        }

        return { success: data && data[0] ? data[0] : null, failed: [], errors: [] };
    } catch (err) {
        console.error("Exception in getMachineOEE:", err);
        return { success: null, failed: [machineId], errors: [{ id: machineId, error: err.message || err }] };
    }
}

/**
 * Calculate OEE for all machines on a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<{success: array|null, failed: array, errors: array}>}
 */
async function getAllMachinesOEE(date) {
    const supabase = getSupabaseClient();
    try {
        const { data, error } = await supabase.rpc('get_all_machines_oee', {
            p_date: date
        });

        if (error) {
            console.log("Error in getAllMachinesOEE:", error);
            return { success: null, failed: [], errors: [{ error: error.message || error }] };
        }

        return { success: data || [], failed: [], errors: [] };
    } catch (err) {
        console.error("Exception in getAllMachinesOEE:", err);
        return { success: null, failed: [], errors: [{ error: err.message || err }] };
    }
}

/**
 * Calculate projected stock for a product at a future date
 * Formula: current_in_stock - orders_due + production_completed
 * @param {string} productId - Product UUID
 * @param {string} targetDate - Target date (YYYY-MM-DD)
 * @returns {Promise<{success: object|null, failed: array, errors: array}>}
 */
async function calculateProjectedStock(productId, targetDate) {
    const supabase = getSupabaseClient();
    try {
        const { data, error } = await supabase.rpc('calculate_projected_stock', {
            p_product_id: productId,
            p_target_date: targetDate
        });

        if (error) {
            console.log("Error in calculateProjectedStock:", error);
            return { success: null, failed: [productId], errors: [{ id: productId, error: error.message || error }] };
        }

        return { success: data && data[0] ? data[0] : null, failed: [], errors: [] };
    } catch (err) {
        console.error("Exception in calculateProjectedStock:", err);
        return { success: null, failed: [productId], errors: [{ id: productId, error: err.message || err }] };
    }
}

/**
 * Calculate projected stock for all products at a future date
 * @param {string} targetDate - Target date (YYYY-MM-DD)
 * @returns {Promise<{success: array|null, failed: array, errors: array}>}
 */
async function calculateAllProductsProjectedStock(targetDate) {
    const supabase = getSupabaseClient();
    try {
        const { data, error } = await supabase.rpc('calculate_all_products_projected_stock', {
            p_target_date: targetDate
        });

        if (error) {
            console.log("Error in calculateAllProductsProjectedStock:", error);
            return { success: null, failed: [], errors: [{ error: error.message || error }] };
        }

        return { success: data || [], failed: [], errors: [] };
    } catch (err) {
        console.error("Exception in calculateAllProductsProjectedStock:", err);
        return { success: null, failed: [], errors: [{ error: err.message || err }] };
    }
}

/**
 * Find a matching predicted order based on time proximity (±10% of interval)
 * @param {string} productId - Product UUID
 * @param {string} customerId - Customer UUID
 * @param {string} orderDate - Order date (YYYY-MM-DD)
 * @param {number} intervalDays - Interval in days (default 30, used for threshold calculation)
 * @returns {Promise<{success: object|null, failed: array, errors: array}>}
 */
async function findMatchingPredictedOrder(productId, customerId, orderDate, intervalDays = 30) {
    const supabase = getSupabaseClient();
    try {
        const { data, error } = await supabase.rpc('find_matching_predicted_order', {
            p_product_id: productId,
            p_customer_id: customerId,
            p_order_date: orderDate,
            p_interval_days: intervalDays
        });

        if (error) {
            console.log("Error in findMatchingPredictedOrder:", error);
            return { success: null, failed: [], errors: [{ error: error.message || error }] };
        }

        // Returns null if no matching prediction found
        return { success: data && data[0] ? data[0] : null, failed: [], errors: [] };
    } catch (err) {
        console.error("Exception in findMatchingPredictedOrder:", err);
        return { success: null, failed: [], errors: [{ error: err.message || err }] };
    }
}

/**
 * Match an order to a predicted order (updates predicted_orders.matching_order_id)
 * @param {string} orderId - Order UUID
 * @param {string} predictedOrderId - Predicted order UUID to match
 * @returns {Promise<{success: boolean, message: string, failed: array, errors: array}>}
 */
async function matchOrderToPrediction(orderId, predictedOrderId) {
    const supabase = getSupabaseClient();
    try {
        const { data, error } = await supabase.rpc('match_order_to_prediction', {
            p_order_id: orderId,
            p_predicted_order_id: predictedOrderId
        });

        if (error) {
            console.log("Error in matchOrderToPrediction:", error);
            return { success: false, message: error.message || 'Unknown error', failed: [orderId], errors: [{ id: orderId, error: error.message || error }] };
        }

        const result = data && data[0] ? data[0] : { success: false, message: 'Unknown result' };
        return { success: result.success, message: result.message, failed: result.success ? [] : [orderId], errors: result.success ? [] : [{ id: orderId, error: result.message }] };
    } catch (err) {
        console.error("Exception in matchOrderToPrediction:", err);
        return { success: false, message: err.message || 'Exception occurred', failed: [orderId], errors: [{ id: orderId, error: err.message || err }] };
    }
}

/**
 * Regenerate the entire production schedule (transactional)
 * Deletes all existing blocks and inserts new ones atomically
 * @param {array} blocks - Array of production block objects
 * @param {object} metrics - Optional schedule metrics to store in settings
 * @returns {Promise<{success: boolean, blocksDeleted: number, blocksInserted: number, message: string, failed: array, errors: array}>}
 */
async function regenerateSchedule(blocks, metrics = {}) {
    const supabase = getSupabaseClient();
    try {
        const { data, error } = await supabase.rpc('regenerate_schedule', {
            p_blocks: blocks,
            p_metrics: metrics
        });

        if (error) {
            console.log("Error in regenerateSchedule:", error);
            return { success: false, blocksDeleted: 0, blocksInserted: 0, message: error.message || 'Unknown error', failed: [], errors: [{ error: error.message || error }] };
        }

        const result = data && data[0] ? data[0] : { success: false, blocks_deleted: 0, blocks_inserted: 0, message: 'Unknown result' };
        return {
            success: result.success,
            blocksDeleted: result.blocks_deleted,
            blocksInserted: result.blocks_inserted,
            message: result.message,
            failed: [],
            errors: result.success ? [] : [{ error: result.message }]
        };
    } catch (err) {
        console.error("Exception in regenerateSchedule:", err);
        return { success: false, blocksDeleted: 0, blocksInserted: 0, message: err.message || 'Exception occurred', failed: [], errors: [{ error: err.message || err }] };
    }
}

/**
 * Get orders with full product and customer details
 * @param {string|null} status - Optional status filter
 * @param {string|null} customerId - Optional customer UUID filter
 * @param {string|null} startDate - Optional start date filter (YYYY-MM-DD)
 * @param {string|null} endDate - Optional end date filter (YYYY-MM-DD)
 * @returns {Promise<{success: array|null, failed: array, errors: array}>}
 */
async function getOrdersWithDetails(status = null, customerId = null, startDate = null, endDate = null) {
    const supabase = getSupabaseClient();
    try {
        const { data, error } = await supabase.rpc('get_orders_with_details', {
            p_status: status,
            p_customer_id: customerId,
            p_start_date: startDate,
            p_end_date: endDate
        });

        if (error) {
            console.log("Error in getOrdersWithDetails:", error);
            return { success: null, failed: [], errors: [{ error: error.message || error }] };
        }

        return { success: data || [], failed: [], errors: [] };
    } catch (err) {
        console.error("Exception in getOrdersWithDetails:", err);
        return { success: null, failed: [], errors: [{ error: err.message || err }] };
    }
}

/**
 * Get production blocks with product, machine, and customer details
 * @param {string|null} startTime - Optional start timestamp filter (ISO format)
 * @param {string|null} endTime - Optional end timestamp filter (ISO format)
 * @param {string|null} machineId - Optional machine UUID filter
 * @returns {Promise<{success: array|null, failed: array, errors: array}>}
 */
async function getProductionBlocksWithDetails(startTime = null, endTime = null, machineId = null) {
    const supabase = getSupabaseClient();
    try {
        const { data, error } = await supabase.rpc('get_production_blocks_with_details', {
            p_start_time: startTime,
            p_end_time: endTime,
            p_machine_id: machineId
        });

        if (error) {
            console.log("Error in getProductionBlocksWithDetails:", error);
            return { success: null, failed: [], errors: [{ error: error.message || error }] };
        }

        return { success: data || [], failed: [], errors: [] };
    } catch (err) {
        console.error("Exception in getProductionBlocksWithDetails:", err);
        return { success: null, failed: [], errors: [{ error: err.message || err }] };
    }
}

/**
 * Get dashboard summary statistics
 * @returns {Promise<{success: object|null, failed: array, errors: array}>}
 */
async function getDashboardSummary() {
    const supabase = getSupabaseClient();
    try {
        const { data, error } = await supabase.rpc('get_dashboard_summary');

        if (error) {
            console.log("Error in getDashboardSummary:", error);
            return { success: null, failed: [], errors: [{ error: error.message || error }] };
        }

        return { success: data && data[0] ? data[0] : null, failed: [], errors: [] };
    } catch (err) {
        console.error("Exception in getDashboardSummary:", err);
        return { success: null, failed: [], errors: [{ error: err.message || err }] };
    }
}

/**
 * Update product stock after production completion
 * @param {string} productId - Product UUID
 * @param {number} quantityChange - Amount to add or subtract
 * @param {string} operation - 'add' or 'subtract' (default: 'add')
 * @returns {Promise<{success: boolean, oldStock: number, newStock: number, message: string, failed: array, errors: array}>}
 */
async function updateProductStock(productId, quantityChange, operation = 'add') {
    const supabase = getSupabaseClient();
    try {
        const { data, error } = await supabase.rpc('update_product_stock', {
            p_product_id: productId,
            p_quantity_change: quantityChange,
            p_operation: operation
        });

        if (error) {
            console.log("Error in updateProductStock:", error);
            return { success: false, oldStock: 0, newStock: 0, message: error.message || 'Unknown error', failed: [productId], errors: [{ id: productId, error: error.message || error }] };
        }

        const result = data && data[0] ? data[0] : { success: false, old_stock: 0, new_stock: 0, message: 'Unknown result' };
        return {
            success: result.success,
            oldStock: result.old_stock,
            newStock: result.new_stock,
            message: result.message,
            failed: result.success ? [] : [productId],
            errors: result.success ? [] : [{ id: productId, error: result.message }]
        };
    } catch (err) {
        console.error("Exception in updateProductStock:", err);
        return { success: false, oldStock: 0, newStock: 0, message: err.message || 'Exception occurred', failed: [productId], errors: [{ id: productId, error: err.message || err }] };
    }
}

module.exports = {
    // Core Supabase utilities
    getSupabaseClient,
    generateSupabaseRowId,
    delay,
    createLimiter,
    
    // Basic CRUD operations
    createRow,
    insertRows,
    readRowCols,
    readRowsBatch,
    readAllRowsCols,
    readAllRowsColsSingle,
    updateRow,
    upsertRows,
    deleteRow,
    deleteRows,
    
    // Settings operations
    readSettings,
    updateSettings,
    
    // Polhem MVP specific functions (RPC wrappers)
    getOrdersQuantityByDateRange,
    getProductionQuantityByTimeRange,
    getMachineOEE,
    getAllMachinesOEE,
    calculateProjectedStock,
    calculateAllProductsProjectedStock,
    findMatchingPredictedOrder,
    matchOrderToPrediction,
    regenerateSchedule,
    getOrdersWithDetails,
    getProductionBlocksWithDetails,
    getDashboardSummary,
    updateProductStock,
};
