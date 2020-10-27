import {bresenhamLine, getImage, toBlob} from './helpers.js';

const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d', {
    desynchronized: true
});

ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = 'black';

let previousPoint = null;
canvas.addEventListener('pointerdown', event => {
    previousPoint = { x: ~~event.offsetX, y: ~~event.offsetY };
});
canvas.addEventListener('pointermove', event => {
    if(previousPoint) {
        const currentPoint = { x: ~~event.offsetX, y: ~~event.offsetY };
        for(const point of bresenhamLine(previousPoint.x, previousPoint.y, currentPoint.x, currentPoint.y)) {
            ctx.fillRect(point.x, point.y, 2, 2);
        }
        previousPoint = currentPoint;
    }
});
canvas.addEventListener('pointerup', () => {
    previousPoint = null;
});

const fileOptions = {
    types: [{
        description: 'PNG Files',
        accept: {'image/png': ['.png']}
    }]
}

const btnSave = document.querySelector('#save');
btnSave.disabled = !('showSaveFilePicker' in window);
btnSave.addEventListener('click', async () => {
    const blob = await toBlob(canvas);
    const handle = await window.showSaveFilePicker(fileOptions);
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
});

const btnOpen = document.querySelector('#open');
btnOpen.disabled = !('showOpenFilePicker' in window);
btnOpen.addEventListener('click', async () => {
    const [handle] = await window.showOpenFilePicker(fileOptions);
    const file = await handle.getFile();
    const image = await getImage(file);
    ctx.drawImage(image, 0, 0);
});

const btnCopy = document.querySelector('#copy');
btnCopy.disabled = !('write' in navigator.clipboard);
btnCopy.addEventListener('click', async () => {
    const blob = await toBlob(canvas);
    await navigator.clipboard.write([
        new ClipboardItem({[blob.type]: blob})
    ]);
});

const btnPaste = document.querySelector('#paste');
btnPaste.disabled = !('read' in navigator.clipboard);
btnPaste.addEventListener('click', async () => {
    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
            if (type === 'image/png') {
                const blob = await clipboardItem.getType(type);
                const image = await getImage(blob);
                ctx.drawImage(image, 0, 0);
            }
        }
    }
});

const btnShare = document.querySelector('#share');
btnShare.disabled = !('canShare' in navigator);
btnShare.addEventListener('click', async () => {
    const blob = await toBlob(canvas);
    const file = new File([blob], 'untitled.png', {type: 'image/png'});
    const item = {files: [file], title: 'untitled.png'};
    if (await navigator.canShare(item)) {
        await navigator.share(item);
    }
});

if ('launchQueue' in window) {
    launchQueue.setConsumer(async params => {
        const [handle] = params.files;
        if (handle) {
            const file = await handle.getFile();
            const image = await getImage(file);
            ctx.drawImage(image, 0, 0);
        }
    });
}
