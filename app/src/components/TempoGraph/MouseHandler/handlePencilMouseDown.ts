import { updateEventsInRange } from "../../../actions"
import { IPoint, pointAdd, pointSub } from "../../../geometry"
import { bpmToUSecPerBeat } from "../../../helpers/bpm"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { setTempoMidiEvent } from "../../../midi/MidiEvent"
import RootStore from "../../../stores/RootStore"
import { isSetTempoEvent } from "../../../track"
import { TempoCoordTransform } from "../../../transform"

export const handlePencilMouseDown =
  ({ song, tempoEditorStore: { quantizer }, pushHistory }: RootStore) =>
  (e: MouseEvent, startPoint: IPoint, transform: TempoCoordTransform) => {
    const track = song.conductorTrack
    if (track === undefined) {
      return
    }

    pushHistory()

    const startClientPos = getClientPos(e)
    const pos = transform.fromPosition(startPoint)
    const bpm = bpmToUSecPerBeat(pos.bpm)

    const event = {
      ...setTempoMidiEvent(0, Math.round(bpm)),
      tick: quantizer.round(pos.tick),
    }
    track.createOrUpdate(event)

    let lastTick = pos.tick
    let lastValue = pos.bpm

    observeDrag({
      onMouseMove: (e) => {
        const posPx = getClientPos(e)
        const deltaPx = pointSub(posPx, startClientPos)
        const local = pointAdd(startPoint, deltaPx)
        const value = Math.max(
          0,
          Math.min(transform.maxBPM, transform.fromPosition(local).bpm),
        )
        const tick = transform.getTicks(local.x)

        updateEventsInRange(track, quantizer, isSetTempoEvent, (v) =>
          setTempoMidiEvent(0, bpmToUSecPerBeat(v)),
        )(lastValue, value, lastTick, tick)

        lastTick = tick
        lastValue = value
      },
    })
  }
