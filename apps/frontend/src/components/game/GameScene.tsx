'use client'

import { useEffect, useRef, useState } from 'react'
import { Character } from './Character'
import { Door } from './Door'

export function GameScene() {
    const [playerPosition, setPlayerPosition] = useState({ x: 100, y: 400 })
    const [velocity, setVelocity] = useState({ x: 0, y: 0 })
    const [isJumping, setIsJumping] = useState(false)
    const [playerDirection, setPlayerDirection] = useState<'left' | 'right'>('right')
    const [currentScene, setCurrentScene] = useState<'main' | 'mentor'>('main')
    const [cameraOffset, setCameraOffset] = useState(0)
    const [isMoving, setIsMoving] = useState(false)
    const [activeDoorId, setActiveDoorId] = useState<number | null>(null)

    const [doors] = useState([
        { id: 1, x: 200, y: 330, name: 'Introduction to C' },
        { id: 2, x: 600, y: 330, name: 'Variables & Data Types' },
        { id: 3, x: 1000, y: 330, name: 'Operators & Expressions' },
        { id: 4, x: 1400, y: 330, name: 'Control Structures' },
        { id: 5, x: 1800, y: 330, name: 'Functions' },
        { id: 6, x: 2200, y: 330, name: 'Arrays & Strings' },
        { id: 7, x: 2600, y: 330, name: 'Pointers' },
        { id: 8, x: 3000, y: 330, name: 'Structures & Unions' },
        { id: 9, x: 3400, y: 330, name: 'File I/O' },
    ])

    const [mentorPosition] = useState({ x: 800, y: 380 })

    const keysPressed = useRef<{ [key: string]: boolean }>({})
    const requestRef = useRef<number>(0)

    const speed = 4
    const jumpPower = 12
    const gravity = 0.5
    const groundY = 390
    const playerSize = 32
    const screenWidth = 800

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keysPressed.current[e.key] = true

            if (e.key === ' ' && !isJumping) {
                setIsJumping(true)
                setVelocity(prev => ({ ...prev, y: -jumpPower }))
            }

            if (e.key === 'ArrowUp' && activeDoorId && currentScene === 'main') {
                setCurrentScene('mentor')
                setPlayerPosition({ x: 100, y: groundY })
                setVelocity({ x: 0, y: 0 })
                setIsJumping(false)
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            keysPressed.current[e.key] = false
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [isJumping, currentScene, activeDoorId])

    useEffect(() => {
        const update = () => {
            let newX = playerPosition.x
            let newY = playerPosition.y
            let newVelX = 0
            let newVelY = velocity.y + gravity

            if (keysPressed.current['ArrowLeft']) {
                newVelX = -speed
                setPlayerDirection('left')
            }
            if (keysPressed.current['ArrowRight']) {
                newVelX = speed
                setPlayerDirection('right')
            }

            newX += newVelX
            newY += newVelY

            // Clamp within world bounds
            newX = Math.max(0, newX)
            newY = Math.min(newY, groundY)

            // Ground collision
            if (newY >= groundY) {
                newY = groundY
                newVelY = 0
                if (isJumping) setIsJumping(false)
            }

            setIsMoving(newVelX !== 0)

            setPlayerPosition({ x: newX, y: newY })
            setVelocity({ x: newVelX, y: newVelY })
            setCameraOffset(Math.max(0, newX - screenWidth / 2))

            const nearDoor = doors.find(
                door => Math.abs(door.x - newX) < 20
            )
            setActiveDoorId(nearDoor?.id || null)

            requestRef.current = requestAnimationFrame(update)
        }

        requestRef.current = requestAnimationFrame(update)
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [playerPosition, velocity, isJumping, doors])

    return (
        <div className="relative h-[500px] w-full overflow-hidden rounded-lg bg-repeat-x bg-bottom"
            style={{ backgroundImage: "url('/assets/background.jpg')" }}
        >
            {currentScene === 'main' ? (
                <>
                    <div
                        className="absolute h-full transition-transform duration-75"
                        style={{
                            width: '4000px',
                            transform: `translateX(-${cameraOffset}px)`,
                        }}
                    >
                        <Character
                            position={playerPosition}
                            direction={playerDirection}
                            isMoving={isMoving}
                            isJumping={isJumping}
                        />

                        {doors.map((door) => (
                            <Door
                                key={door.id}
                                position={{ x: door.x, y: door.y }}
                                name={door.name}
                                isActive={door.id === activeDoorId}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <div className="relative h-[700px] w-full overflow-hidden rounded-lg bg-repeat-x" style={{ backgroundImage: " url('/assets/background.jpg')" }}>
                    <Character position={playerPosition} direction={playerDirection} />
                    <Character position={mentorPosition} isMentor direction="right" />
                    <button
                        className="absolute bottom-4 z-10 right-4 rounded bg-blue-500 px-4 py-2 text-white"
                        onClick={() => {
                            setCurrentScene('main')
                            setPlayerPosition({ x: 100, y: groundY })
                            setVelocity({ x: 0, y: 0 })
                            setIsJumping(false)
                        }}
                    >
                        Exit
                    </button>
                </div>
            )}
        </div>
    )
}
