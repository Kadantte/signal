import { GLCanvas, Transform } from "@ryohey/webgl-react"
import Color from "color"
import { observer } from "mobx-react-lite"
import { FC, useCallback, useMemo } from "react"
import { changeNotesVelocity, updateVelocitiesInRange } from "../../../actions"
import { IPoint, IRect, containsPoint, pointAdd } from "../../../geometry"
import { colorToVec4 } from "../../../gl/color"
import { matrixFromTranslation } from "../../../helpers/matrix"
import { observeDrag, observeDrag2 } from "../../../helpers/observeDrag"
import { useStores } from "../../../hooks/useStores"
import { useTheme } from "../../../hooks/useTheme"
import { isNoteEvent } from "../../../track"
import { Beats } from "../../GLNodes/Beats"
import { Cursor } from "../../GLNodes/Cursor"
import { VelocityItems } from "./VelocityItems"

export type VelocityItem = IRect & {
  id: number
  isSelected: boolean
  hitArea: IRect
}

export const VelocityControlCanvas: FC<{ width: number; height: number }> =
  observer(({ width, height }) => {
    const rootStore = useStores()
    const {
      pianoRollStore: {
        transform,
        scrollLeft,
        windowedEvents,
        rulerStore: { beats },
        selectedNoteIds,
        cursorX,
      },
    } = rootStore
    const theme = useTheme()

    const items: VelocityItem[] = useMemo(
      () =>
        windowedEvents.filter(isNoteEvent).map((note) => {
          const { x } = transform.getRect(note)
          const itemWidth = 5
          const itemHeight = (note.velocity / 127) * height
          return {
            id: note.id,
            x,
            y: height - itemHeight,
            width: itemWidth,
            height: itemHeight,
            isSelected: selectedNoteIds.includes(note.id),
            hitArea: {
              x,
              y: 0,
              width: itemWidth,
              height,
            },
          }
        }),
      [windowedEvents, height, transform, selectedNoteIds],
    )

    const hitTest = (point: IPoint) => {
      return items.filter((n) => containsPoint(n.hitArea, point))
    }

    const onMouseDown = useCallback(
      (ev: React.MouseEvent) => {
        const e = ev.nativeEvent
        const startPoint = {
          x: e.offsetX + scrollLeft,
          y: e.offsetY,
        }
        let hitItems = hitTest(startPoint)

        if (selectedNoteIds.length > 0) {
          hitItems = hitItems.filter((e) => e.isSelected)
        }

        const startY = e.clientY - e.offsetY

        const calcValue = (e: MouseEvent) => {
          const offsetY = e.clientY - startY
          return Math.round(
            Math.max(0, Math.min(1, 1 - offsetY / height)) * 127,
          )
        }

        if (hitItems.length === 0) {
          handlePaintingDrag()
        } else {
          handleSingleDrag()
        }

        function handlePaintingDrag() {
          let lastTick = transform.getTicks(startPoint.x)
          let lastValue = calcValue(e)

          observeDrag2(e, {
            onMouseMove: (e, delta) => {
              const local = pointAdd(startPoint, delta)
              const tick = transform.getTicks(local.x)
              const value = calcValue(e)

              updateVelocitiesInRange(rootStore)(
                lastTick,
                lastValue,
                tick,
                value,
              )
              lastTick = tick
              lastValue = value
            },
          })
        }

        function handleSingleDrag() {
          const noteIds = hitItems.map((e) => e.id)

          changeNotesVelocity(rootStore)(noteIds, calcValue(e))

          observeDrag({
            onMouseMove: (e) =>
              changeNotesVelocity(rootStore)(noteIds, calcValue(e)),
          })
        }
      },
      [height, items, rootStore, selectedNoteIds, scrollLeft],
    )

    const scrollXMatrix = useMemo(
      () => matrixFromTranslation(-scrollLeft, 0),
      [scrollLeft],
    )

    const strokeColor = useMemo(
      () => colorToVec4(Color(theme.themeColor).lighten(0.3)),
      [theme],
    )
    const activeColor = useMemo(
      () => colorToVec4(Color(theme.themeColor)),
      [theme],
    )
    const selectedColor = useMemo(
      () => colorToVec4(Color(theme.themeColor).lighten(0.7)),
      [theme],
    )

    return (
      <GLCanvas width={width} height={height} onMouseDown={onMouseDown}>
        <Transform matrix={scrollXMatrix}>
          <VelocityItems
            rects={items}
            strokeColor={strokeColor}
            activeColor={activeColor}
            selectedColor={selectedColor}
            zIndex={1}
          />
          <Beats height={height} beats={beats} zIndex={2} />
          <Cursor x={cursorX} height={height} zIndex={4} />
        </Transform>
      </GLCanvas>
    )
  })
