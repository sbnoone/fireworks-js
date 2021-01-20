import { Trace } from './trace'
import { Explosion } from './explosion'

import {
    getRender,
    playSound,
    randomInteger
} from './utils/index'

interface FireworksOptions {
    id: string
    hue?: number
    delay?: number
    minDelay?: number
    maxDelay?: number
    boundaries?: BoundariesOptions
    fireworkSpeed?: number
    fireworkAcceleration?: number
    particleCount?: number
    particleFriction?: number
    particleGravity?: number
    debug?: boolean
    sounds?: boolean
}

interface BoundariesOptions {
    top: number
    bottom: number
    left: number
    right: number
}

interface FireworksDraw {
    draw: () => void
    update: (args: (x: number, y: number, hue: number) => void) => void
}

export class Fireworks {
    private _canvas: HTMLCanvasElement
    private _width: number
    private _height: number
    private _ctx: CanvasRenderingContext2D | null

    private _hue: number
    private _delay: number
    private _minDelay: number
    private _maxDelay: number
    private _boundaries: BoundariesOptions
    private _speed: number
    private _acceleration: number
    private _particleCount: number
    private _friction: number
    private _gravity: number
    private _sounds: boolean

    private _fps = 0
    private _tick = 0
    private _version = '1.0.0'
    private _running = false
    private _debug: boolean
    private _decimalPlaces = 2
    private _updateEachSecond = 1
    private _decimalPlacesRatio = Math.pow(10, this._decimalPlaces)
    private _timeMeasurements: number[] = []

    private _fireworks: FireworksDraw[] = []
    private _particles: FireworksDraw[] = []

    constructor(params: FireworksOptions) {
        this._canvas = this.getCanvasElement(params.id)
        this._width = this._canvas.width
        this._height = this._canvas.height
        this._ctx = this._canvas.getContext ? this._canvas.getContext('2d') : null

        this._hue = params.hue || 120
        this._delay = params.delay || 30
        this._minDelay = params.minDelay || 30
        this._maxDelay = params.maxDelay || 90
        this._boundaries = params.boundaries || {
            top: 50,
            bottom: this._height * 0.5,
            left: 50,
            right: this._width - 50
        }
        this._speed = params.fireworkSpeed || 2
        this._acceleration = params.fireworkAcceleration || 1.05
        this._particleCount = params.particleCount || 50
        this._friction = params.particleFriction || 0.95
        this._gravity = params.particleGravity || 1.5
        this._debug = params.debug || false
        this._sounds = params.sounds || false
    }

    start() {
        if (this._running) {
            return
        }

        this._running = true
        this.clear()
        this.render()
    }

    stop() {
        this._running = false
        this.clear()
    }

    pause() {
        this._running = !this._running

        if (this._running) {
            this.render()
        }
    }

    clear() {
        if (!this._ctx) {
            return
        }

        this._fireworks = []
        this._particles = []
        this._ctx.clearRect(0, 0, this._width, this._height)
    }

    get isRunning() {
        return this._running
    }

    private showFPS() {
        if (!this._ctx) {
            return
        }

        this._timeMeasurements.push(performance.now())

        const msPassed = this._timeMeasurements[this._timeMeasurements.length - 1] - this._timeMeasurements[0]

        if (msPassed >= this._updateEachSecond * 1000) {
            this._fps = Math.round(this._timeMeasurements.length / msPassed * 1000 * this._decimalPlacesRatio) / this._decimalPlacesRatio
            this._timeMeasurements = []
        }

        this._ctx.fillStyle = '#FFF'
        this._ctx.font = 'bold 14pt monospace'
        this._ctx.fillText(Math.round(this._fps) + ' fps', 10, 26)
    }

    private render() {
        if (!this._ctx || !this._running) {
            return
        }

        let length: number

        getRender(() => {
            this.render()

            if (this._debug) {
                this.showFPS()
            }
        })

        this._hue += 0.5
        this._ctx.globalCompositeOperation = 'destination-out'
        this._ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        this._ctx.fillRect(0, 0, this._width, this._height)
        this._ctx.globalCompositeOperation = 'lighter'

        length = this._fireworks.length
        while (length--) {
            this._fireworks[length].draw()
            this._fireworks[length].update((x: number, y: number, hue: number) => {
                let count = this._particleCount

                // TODO: Sound management
                if (this._sounds) {
                    playSound(0, 2)
                }

                while (count--) {
                    this._particles.push(new Explosion(
                        x,
                        y,
                        this._ctx,
                        hue,
                        this._friction,
                        this._gravity
                    ))
                }
                this._fireworks.splice(length, 1)
            })
        }

        length = this._particles.length
        while (length--) {
            this._particles[length].draw()
            this._particles[length].update(() => {
                this._particles.splice(length, 1)
            })
        }

        if (this._tick === this._delay) {
            this._fireworks.push(new Trace(
                this._width * 0.5,
                this._height,
                randomInteger(this._boundaries.left, this._boundaries.right),
                randomInteger(this._boundaries.top, this._boundaries.bottom),
                this._ctx,
                this._hue,
                this._speed,
                this._acceleration
            ))

            this._delay = randomInteger(this._minDelay, this._maxDelay)
            this._tick = 0
        }

        this._tick++
    }

    private getCanvasElement(id: string | null) {
        const defaultId = 'fireworks-js'
        const canvasElement = document.getElementById(id || defaultId)

        if (canvasElement !== null) {
            return (canvasElement as HTMLCanvasElement)
        }

        throw new Error(`Target canvas element #${id} is not found!`)
    }
}