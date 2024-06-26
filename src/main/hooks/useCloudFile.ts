import { ChangeEvent } from "react"
import { useLocalization } from "../../common/localize/useLocalization"
import { emptySong } from "../../common/song"
import { openSong, saveSong, setSong } from "../actions"
import { createSong, updateSong } from "../actions/cloudSong"
import { hasFSAccess, openFile, saveFileAs } from "../actions/file"
import { useDialog } from "./useDialog"
import { useProgress } from "./useProgress"
import { usePrompt } from "./usePrompt"
import { useStores } from "./useStores"
import { useToast } from "./useToast"

export const useCloudFile = () => {
  const rootStore = useStores()
  const { rootViewStore, song } = rootStore
  const toast = useToast()
  const prompt = usePrompt()
  const dialog = useDialog()
  const { show: showProgress } = useProgress()
  const localized = useLocalization()

  const saveOrCreateSong = async () => {
    const { song } = rootStore
    if (song.cloudSongId !== null) {
      if (song.name.length === 0) {
        const text = await prompt.show({
          title: localized("save-as", "Save as"),
        })
        if (text !== null && text.length > 0) {
          song.name = text
        }
      }
      const closeProgress = showProgress(
        localized("song-saving", "Saving song..."),
      )
      try {
        await updateSong(rootStore)(song)
        toast.success(localized("song-saved", "Song saved"))
      } catch (e) {
        alert((e as Error).message)
      } finally {
        closeProgress()
      }
    } else {
      if (song.name.length === 0) {
        const text = await prompt.show({
          title: localized("save-as", "Save as"),
        })
        if (text !== null && text.length > 0) {
          song.name = text
        }
      }
      const closeProgress = showProgress(
        localized("song-saving", "Saving song..."),
      )
      try {
        await createSong(rootStore)(song)
        toast.success(localized("song-created", "Song created"))
      } catch (e) {
        alert((e as Error).message)
      } finally {
        closeProgress()
      }
    }
  }

  // true: saved or not necessary
  // false: canceled
  const saveIfNeeded = async (): Promise<boolean> => {
    const { song } = rootStore
    if (song.isSaved) {
      return true
    }

    const res = await dialog.show({
      title: localized(
        "save-changes",
        "Do you want to save your changes to the song?",
      ),
      actions: [
        { title: localized("yes", "Yes"), key: "yes" },
        { title: localized("no", "No"), key: "no" },
        { title: localized("cancel", "Cancel"), key: "cancel" },
      ],
    })
    switch (res) {
      case "yes":
        await saveOrCreateSong()
        return true
      case "no":
        return true
      case "cancel":
        return false
    }
  }

  return {
    async createNewSong() {
      try {
        if (!(await saveIfNeeded())) {
          return
        }
        const newSong = emptySong()
        setSong(rootStore)(newSong)
        await createSong(rootStore)(newSong)
        toast.success(localized("song-created", "Song created"))
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async openSong() {
      try {
        if (!(await saveIfNeeded())) {
          return
        }
        rootViewStore.openCloudFileDialog = true
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async saveSong() {
      await saveOrCreateSong()
    },
    async saveAsSong() {
      try {
        const text = await prompt.show({
          title: localized("save-as", "Save as"),
          initialText: song.name,
        })
        if (text !== null && text.length > 0) {
          song.name = text
        } else {
          return
        }
        await createSong(rootStore)(song)
        toast.success(localized("song-saved", "Song saved"))
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async renameSong() {
      try {
        const text = await prompt.show({
          title: localized("rename", "Rename"),
        })
        if (text !== null && text.length > 0) {
          song.name = text
        } else {
          return Promise.resolve(false)
        }
        if (song.cloudSongId !== null) {
          await updateSong(rootStore)(song)
        } else {
          await createSong(rootStore)(song)
        }
        toast.success(localized("song-saved", "Song saved"))
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async importSong() {
      try {
        if (!(await saveIfNeeded())) {
          return
        }
        await openFile(rootStore)
        await saveOrCreateSong()
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async importSongLegacy(e: ChangeEvent<HTMLInputElement>) {
      try {
        await openSong(rootStore)(e.currentTarget)
        await saveOrCreateSong()
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async exportSong() {
      try {
        if (hasFSAccess) {
          await saveFileAs(rootStore)
        } else {
          saveSong(rootStore)()
        }
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async publishSong() {
      rootViewStore.openPublishDialog = true
    },
  }
}
