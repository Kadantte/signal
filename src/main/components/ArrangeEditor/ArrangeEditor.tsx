import React, { FC } from "react"
import { useStores } from "../../hooks/useStores"
import { ArrangeToolbar } from "../ArrangeView/ArrangeToolbar"
import NavigationBar from "../groups/NavigationBar"
import "./ArrangeEditor.css"
import ArrangeView from "./ArrangeView"

interface NavItemProps {
  title: string
  onClick: () => void
}

function NavItem({ title, onClick }: NavItemProps) {
  return (
    <div className="NavItem" onClick={onClick}>
      {title}
    </div>
  )
}

export const ArrangeEditor: FC = () => {
  const { router } = useStores()

  return (
    <div className="ArrangeEditor">
      <NavigationBar>
        <ArrangeToolbar />
      </NavigationBar>
      <ArrangeView />
    </div>
  )
}
