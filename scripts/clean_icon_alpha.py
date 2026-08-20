from collections import deque
from pathlib import Path
import sys

from PIL import Image


def is_connected_background(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, _ = pixel
    return min(red, green, blue) >= 180 and max(red, green, blue) - min(red, green, blue) <= 16


def clean_connected_background(path: Path) -> None:
    image = Image.open(path).convert('RGBA')
    pixels = image.load()
    width, height = image.size
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if visited[index] or not is_connected_background(pixels[x, y]):
            return
        visited[index] = 1
        queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        red, green, blue, _ = pixels[x, y]
        pixels[x, y] = (red, green, blue, 0)
        if x > 0:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y > 0:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    alpha = image.getchannel('A')
    histogram = alpha.histogram()
    transparent = histogram[0]
    partial = sum(histogram[1:255])
    if transparent == 0:
        raise RuntimeError(f'No connected background was removed from {path}.')
    if partial > 0:
        raise RuntimeError(f'Unexpected partial alpha pixels remain in {path}: {partial}.')

    image.save(path, optimize=True)
    print(f'{path}: {width}x{height}, transparent={transparent}, partial={partial}')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: clean_icon_alpha.py <png-path>')
    clean_connected_background(Path(sys.argv[1]).resolve())
