'use client'

import Image from 'next/image'

interface DoorProps {
    position: { x: number; y: number }
    name: string
    isActive?: boolean
}

export function Door({ position, name, isActive = false }: DoorProps) {
    const doorWidth = 170
    const doorHeight = 95

    return (
        <div
            className="absolute text-center"
            style={{
                left: position.x - doorWidth / 2,
                top: position.y - doorHeight,
                width: doorWidth,
            }}
        >
            {/* Door label */}
            <div className="text-xs font-bold bg-[#f25160] px-2 py-1 rounded-lg text-white mb-0">
                {name}
            </div>

            {/* Door image */}
            <Image
                src="/assets/door.png"
                alt={name}
                width={doorWidth}
                height={doorHeight}
                style={{
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                }}
            />

            {/* Prompt to enter */}
            {isActive && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 transform text-white text-xs bg-black/60 px-0 w-full py-1 rounded shadow">
                    Press ↑ to enter
                </div>
            )}
        </div>
    )
}
