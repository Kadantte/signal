import styled from "@emotion/styled"
import RemoveIcon from "mdi-react/RemoveIcon"
import { observer } from "mobx-react-lite"
import { FC } from "react"
import { Button } from "../../../components/Button"
import { Localized } from "../../../components/Localized"
import { useStores } from "../../hooks/useStores"

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
`

export const SoundFontScanPathList: FC = observer(() => {
  const { soundFontStore } = useStores()
  const { scanPaths } = soundFontStore

  const removeScanPath = async (path: string) => {
    await soundFontStore.removeScanPath(path)
  }

  const onClickAddButton = async () => {
    const path = await window.electronAPI.showOpenDirectoryDialog()
    if (path) {
      soundFontStore.addScanPath(path)
    }
  }

  const onClickScanButton = () => {
    soundFontStore.scanSoundFonts()
  }

  return (
    <>
      {scanPaths.length === 0 && (
        <p>
          <i>No scan paths</i>
        </p>
      )}
      {scanPaths.map((path) => (
        <ScanPathRow
          key={path}
          path={path}
          onClickDelete={() => removeScanPath(path)}
        />
      ))}
      <Actions>
        <Button onClick={onClickAddButton}>
          <Localized default="Add">add</Localized>
        </Button>
        <Button onClick={onClickScanButton}>
          <Localized default="Scan">scan</Localized>
        </Button>
      </Actions>
    </>
  )
})

const ScanPathLabel = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.secondaryTextColor};
`

const Remove = styled(RemoveIcon)`
  width: 1rem;
  color: ${({ theme }) => theme.secondaryTextColor};
`

const RowWrapper = styled.div`
  display: flex;
  align-items: center;
`

interface ScanPathRowProps {
  path: string
  onClickDelete: () => void
}

const ScanPathRow: FC<ScanPathRowProps> = ({ path, onClickDelete }) => {
  return (
    <RowWrapper>
      <ScanPathLabel>{path}</ScanPathLabel>
      <Button
        style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}
        onClick={onClickDelete}
      >
        <Remove />
      </Button>
    </RowWrapper>
  )
}
