'use client'

import Image from 'next/image'

interface CharacterProps {
    position: { x: number; y: number }
    isMentor?: boolean
    direction?: 'left' | 'right'
}

export function Character({
    position,
    isMentor = false,
    direction = 'right',
}: CharacterProps) {
    const imageSrc = isMentor ? '/sprites/mentor.png' : '/sprites/character.png'

    // Dimensions per sprite
    const dimensions = isMentor
        ? { originalWidth: 2500, originalHeight: 2500, displayWidth: 80 }
        : { originalWidth: 595, originalHeight: 924, displayWidth: 60 }

    const displayHeight = autoHeight(dimensions.displayWidth, dimensions.originalWidth, dimensions.originalHeight)

    return (
        <div
            className={`absolute ${isMentor ? 'z-20' : 'z-10'}`}
            style={{
                left: position.x,
                top: position.y - displayHeight,
                transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
            }}
        >
            <Image
                src={imageSrc}
                alt={isMentor ? 'mentor' : 'character'}
                width={dimensions.displayWidth}
                height={displayHeight}
                style={{
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                }}
            />
        </div>
    )
}

// Maintain aspect ratio
function autoHeight(displayWidth: number, originalWidth: number, originalHeight: number) {
    return (originalHeight / originalWidth) * displayWidth
}
