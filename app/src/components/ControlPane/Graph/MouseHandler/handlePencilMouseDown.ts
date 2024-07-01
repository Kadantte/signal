import {
  createEvent as createTrackEvent,
  updateValueEvents,
} from "../../../../actions"
import { pushHistory } from "../../../../actions/history"
import { IPoint, pointAdd, pointSub } from "../../../../geometry"
import { getClientPos } from "../../../../helpers/mouseEvent"
import { observeDrag } from "../../../../helpers/observeDrag"
import {
  ValueEventType,
  createValueEvent,
} from "../../../../helpers/valueEvent"
import RootStore from "../../../../stores/RootStore"
import { ControlCoordTransform } from "../../../../transform/ControlCoordTransform"

export const handlePencilMouseDown =
  (rootStore: RootStore) =>
  (
    e: MouseEvent,
    startPoint: IPoint,
    transform: ControlCoordTransform,
    type: ValueEventType,
  ) => {
    pushHistory(rootStore)()

    rootStore.controlStore.selectedEventIds = []
    rootStore.controlStore.selection = null
    rootStore.pianoRollStore.selection = null
    rootStore.pianoRollStore.selectedNoteIds = []

    const startClientPos = getClientPos(e)
    const pos = transform.fromPosition(startPoint)

    const event = createValueEvent(type)(pos.value)
    createTrackEvent(rootStore)(event, pos.tick)

    let lastTick = pos.tick
    let lastValue = pos.value

    observeDrag({
      onMouseMove: (e) => {
        const posPx = getClientPos(e)
        const deltaPx = pointSub(posPx, startClientPos)
        const local = pointAdd(startPoint, deltaPx)
        const value = Math.max(
          0,
          Math.min(transform.maxValue, transform.fromPosition(local).value),
        )
        const tick = transform.getTicks(local.x)

        updateValueEvents(type)(rootStore)(lastValue, value, lastTick, tick)

        lastTick = tick
        lastValue = value
      },
    })
  }
