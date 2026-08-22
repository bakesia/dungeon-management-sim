from collections import deque
from pathlib import Path
import sys

from PIL import Image


COLS = 5
ROWS = 4
CELL_SIZE = 280

# 최종 아틀라스: 정확히 1400 x 1120
OUTPUT_WIDTH = COLS * CELL_SIZE
OUTPUT_HEIGHT = ROWS * CELL_SIZE


def is_background(pixel):
    r, g, b, _ = pixel

    # 현재 원본의 흰색/회색 체크무늬 배경
    return (
        min(r, g, b) >= 180
        and max(r, g, b) - min(r, g, b) <= 16
    )


def remove_background(image):
    image = image.convert("RGBA")

    pixels = image.load()
    width, height = image.size

    visited = bytearray(width * height)
    queue = deque()

    def enqueue(x, y):
        index = y * width + x

        if visited[index]:
            return

        if not is_background(pixels[x, y]):
            return

        visited[index] = 1
        queue.append((x, y))

    # 전체 이미지 외곽에서 연결된 배경 탐색
    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)

    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()

        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)

        if x > 0:
            enqueue(x - 1, y)

        if x + 1 < width:
            enqueue(x + 1, y)

        if y > 0:
            enqueue(x, y - 1)

        if y + 1 < height:
            enqueue(x, y + 1)

    return image


def find_components(image):
    """
    투명 배경 제거 후 각각의 그림 덩어리를 찾는다.
    고블린 2마리나 버섯 2개처럼 분리된 그림도 각각 감지된다.
    """

    alpha = image.getchannel("A")
    pixels = alpha.load()

    width, height = image.size

    visited = bytearray(width * height)
    components = []

    for start_y in range(height):
        for start_x in range(width):

            index = start_y * width + start_x

            if visited[index]:
                continue

            if pixels[start_x, start_y] == 0:
                continue

            queue = deque([(start_x, start_y)])
            visited[index] = 1

            min_x = start_x
            max_x = start_x
            min_y = start_y
            max_y = start_y

            pixel_count = 0

            while queue:
                x, y = queue.popleft()
                pixel_count += 1

                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)

                neighbors = (
                    (x - 1, y),
                    (x + 1, y),
                    (x, y - 1),
                    (x, y + 1),
                )

                for nx, ny in neighbors:

                    if not (0 <= nx < width and 0 <= ny < height):
                        continue

                    n_index = ny * width + nx

                    if visited[n_index]:
                        continue

                    if pixels[nx, ny] == 0:
                        continue

                    visited[n_index] = 1
                    queue.append((nx, ny))

            # 아주 작은 노이즈 제거
            if pixel_count < 20:
                continue

            components.append(
                {
                    "bbox": (
                        min_x,
                        min_y,
                        max_x + 1,
                        max_y + 1,
                    ),
                    "pixels": pixel_count,
                }
            )

    return components


def normalize_atlas(image):
    components = find_components(image)

    #
    # 원본 그림이 정확한 셀에 안 들어가 있기 때문에
    # '자르기 경계'로 판단하지 않는다.
    #
    # 그림의 중심점이 어느 5x4 슬롯에 가장 가까운지를 계산한다.
    #
    # 목표 중심:
    #
    # 140, 420, 700, 980, 1260
    #
    # y도 동일하게:
    #
    # 140, 420, 700, 980
    #

    slots = {}

    target_x = [
        CELL_SIZE // 2 + CELL_SIZE * i
        for i in range(COLS)
    ]

    target_y = [
        CELL_SIZE // 2 + CELL_SIZE * i
        for i in range(ROWS)
    ]

    for component in components:

        x0, y0, x1, y1 = component["bbox"]

        center_x = (x0 + x1) / 2
        center_y = (y0 + y1) / 2

        col = min(
            range(COLS),
            key=lambda c: abs(center_x - target_x[c])
        )

        row = min(
            range(ROWS),
            key=lambda r: abs(center_y - target_y[r])
        )

        slots.setdefault((row, col), []).append(component)

    output = Image.new(
        "RGBA",
        (OUTPUT_WIDTH, OUTPUT_HEIGHT),
        (0, 0, 0, 0),
    )

    for row in range(ROWS):
        for col in range(COLS):

            group = slots.get((row, col))

            if not group:
                continue

            # 같은 슬롯에 여러 그림이 들어갈 수도 있음.
            #
            # 예:
            # 고블린 두 마리
            # 버섯 두 개
            #
            # 따라서 전부 하나의 아이콘으로 묶는다.

            min_x = min(c["bbox"][0] for c in group)
            min_y = min(c["bbox"][1] for c in group)

            max_x = max(c["bbox"][2] for c in group)
            max_y = max(c["bbox"][3] for c in group)

            sprite = image.crop(
                (
                    min_x,
                    min_y,
                    max_x,
                    max_y,
                )
            )

            sprite_width, sprite_height = sprite.size

            if sprite_width > CELL_SIZE:
                raise RuntimeError(
                    f"row={row}, col={col}: "
                    f"아이콘 가로가 너무 큽니다: {sprite_width}px"
                )

            if sprite_height > CELL_SIZE:
                raise RuntimeError(
                    f"row={row}, col={col}: "
                    f"아이콘 세로가 너무 큽니다: {sprite_height}px"
                )

            # 280 x 280 셀 정확한 중앙
            destination_x = (
                col * CELL_SIZE
                + (CELL_SIZE - sprite_width) // 2
            )

            destination_y = (
                row * CELL_SIZE
                + (CELL_SIZE - sprite_height) // 2
            )

            output.alpha_composite(
                sprite,
                (destination_x, destination_y),
            )

    return output


def process(path):
    original = Image.open(path).convert("RGBA")

    print(
        f"원본 크기: "
        f"{original.width}x{original.height}"
    )

    transparent = remove_background(original)

    normalized = normalize_atlas(transparent)

    output_path = path.with_name(
        "game-icons-atlas-fixed.png"
    )

    normalized.save(
        output_path,
        optimize=True,
    )

    print(
        f"완료: {output_path}"
    )

    print(
        f"최종 크기: "
        f"{normalized.width}x{normalized.height}"
    )


if __name__ == "__main__":

    if len(sys.argv) != 2:
        raise SystemExit(
            "Usage: "
            "py scripts/clean_icon_alpha.py "
            "<game-icons-atlas.png>"
        )

    process(
        Path(sys.argv[1]).resolve()
    )