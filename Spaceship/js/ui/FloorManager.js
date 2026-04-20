export class FloorManager {
    constructor(builder) {
        this.builder = builder;
        this.container = null;
    }
    
    init() {
        this.container = document.getElementById('floor-list');
        
        document.getElementById('add-floor-above').addEventListener('click', () => {
            this.builder.addFloor('up');
        });
        
        document.getElementById('add-floor-below').addEventListener('click', () => {
            this.builder.addFloor('down');
        });
        
        this.updateFloorList();
    }
    
    updateFloorList() {
        this.container.innerHTML = '';
        const floors = this.builder.gridSystem.floors;
        const current = this.builder.currentFloor;
        
        // Show floors in reverse order (top to bottom)
        for (let i = floors - 1; i >= 0; i--) {
            const floorItem = document.createElement('div');
            floorItem.className = 'floor-item';
            if (i === current) {
                floorItem.classList.add('active');
            }
            floorItem.dataset.floor = i;
            
            const floorName = i === 0 ? 'Ground' : i > 0 ? `Level ${i}` : `Basement ${Math.abs(i)}`;
            floorItem.innerHTML = `
                <span class="floor-name">${floorName}</span>
                <span class="floor-number">${i}</span>
            `;
            
            floorItem.addEventListener('click', () => {
                this.builder.setCurrentFloor(i);
            });
            
            this.container.appendChild(floorItem);
        }
    }
}