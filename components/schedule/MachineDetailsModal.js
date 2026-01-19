'use client';

import Modal from '@/components/shared/Modal';
import { cn } from '@/lib/utils';

export default function MachineDetailsModal({
  isOpen,
  onClose,
  machine,
  oee,
}) {
  if (!machine) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Machine ${machine.code}`}
      size="small"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Name</p>
            <p className="text-sm text-white mt-1">{machine.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">OEE</p>
            <p className={cn(
              'text-sm font-semibold mt-1',
              oee >= 80 ? 'text-green-400' : oee >= 50 ? 'text-yellow-400' : 'text-zinc-400'
            )}>
              {oee?.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Max Shot Weight</p>
            <p className="text-sm text-white mt-1">{machine.max_shot_weight}g</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Clamp Force</p>
            <p className="text-sm text-white mt-1">{machine.clamp_force} kN</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Max Pressure</p>
            <p className="text-sm text-white mt-1">{machine.max_pressure} bar</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Max Temperature</p>
            <p className="text-sm text-white mt-1">{machine.max_temperature}C</p>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Compatible Materials</p>
          <div className="flex flex-wrap gap-2">
            {machine.compatible_materials?.length > 0 ? (
              machine.compatible_materials.map((material) => (
                <span 
                  key={material} 
                  className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300"
                >
                  {material}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-500">-</span>
            )}
          </div>
        </div>
        
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Status</p>
          <p className="text-sm text-white mt-1 capitalize">{machine.status}</p>
        </div>
      </div>
    </Modal>
  );
}
