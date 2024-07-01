import { IEventSource, PlayerEvent, SendableEvent } from "@signal-app/player"
import { filterEventsWithRange } from "../helpers/filterEvents"
import { Beat, createBeatsInRange } from "../helpers/mapBeats"
import { noteOnMidiEvent } from "../midi/MidiEvent"
import { SongProvider } from "../song/SongProvider"
import { getStatusEvents } from "../track/selector"
import { convertTrackEvents } from "./collectAllEvents"

export const METRONOME_TRACK_ID = 99999

export class EventSource implements IEventSource {
  constructor(private readonly songStore: SongProvider) {}

  get timebase(): number {
    return this.songStore.song.timebase
  }

  get endOfSong(): number {
    return this.songStore.song.endOfSong
  }

  getEvents(startTick: number, endTick: number): PlayerEvent[] {
    const { song } = this.songStore
    return filterEventsWithRange(song.allEvents, startTick, endTick).concat(
      filterEventsWithRange(
        createBeatsInRange(
          song.measures,
          song.timebase,
          startTick,
          endTick,
        ).flatMap((b) => beatToEvents(b)),
        startTick,
        endTick,
      ),
    )
  }

  getCurrentStateEvents(tick: number): SendableEvent[] {
    return this.songStore.song.tracks.flatMap((t, i) => {
      const statusEvents = getStatusEvents(t.events, tick)
      return convertTrackEvents(statusEvents, t.channel, i)
    })
  }
}

function beatToEvents(beat: Beat): PlayerEvent[] {
  const velocity = beat.beat === 0 ? 100 : 70
  const noteNumber = beat.beat === 0 ? 76 : 77
  return [
    {
      ...noteOnMidiEvent(0, 9, noteNumber, velocity),
      tick: beat.tick,
      trackId: METRONOME_TRACK_ID,
    },
  ]
}
