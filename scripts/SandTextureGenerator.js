// Create a canvas element
const canvas = document.createElement('canvas');
const size = 256;
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d');

// Fill with base sand color
ctx.fillStyle = '#d2b48c';
ctx.fillRect(0, 0, size, size);

// Add noise for sand grain effect
for (let i = 0; i < 50000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 1.5;
    const alpha = Math.random() * 0.1;
    
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

// Export the texture
const dataURL = canvas.toDataURL('image/png');
const link = document.createElement('a');
link.download = 'sand.png';
link.href = dataURL;
link.click(); 