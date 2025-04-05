// apps/frontend/src/app/game/page.tsx
'use client'

import { GameScene } from "../../components/game/GameScene"

export default function GamePage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4">
            <GameScene />
        </div>
    )
}