/**
 * Dot Matrix Display Utility
 * Creates chunky 4x4 pixel displays like pinball machines
 */

import * as PIXI from 'pixi.js'
import { TERMINAL_COLORS } from './pixiUtils.js'

export class DotMatrix {
  constructor(width, height, pixelSize = 4) {
    this.width = width
    this.height = height
    this.pixelSize = pixelSize
    this.container = new PIXI.Container()
    this.pixels = []
    
    // Create pixel grid
    for (let y = 0; y < height; y++) {
      this.pixels[y] = []
      for (let x = 0; x < width; x++) {
        const pixel = new PIXI.Graphics()
        pixel.x = x * pixelSize
        pixel.y = y * pixelSize
        this.pixels[y][x] = pixel
        this.container.addChild(pixel)
      }
    }
  }
  
  setPixel(x, y, color = TERMINAL_COLORS.GREEN) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return
    
    const pixel = this.pixels[y][x]
    pixel.clear()
    pixel.beginFill(color)
    pixel.drawRect(0, 0, this.pixelSize, this.pixelSize)
    pixel.endFill()
  }
  
  clearPixel(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return
    this.pixels[y][x].clear()
  }
  
  clear() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.pixels[y][x].clear()
      }
    }
  }
  
  drawText(text, x, y, color = TERMINAL_COLORS.GREEN) {
    const font = FONT_5X7
    let currentX = x
    
    for (let char of text.toUpperCase()) {
      const pattern = font[char] || font[' ']
      this.drawPattern(pattern, currentX, y, color)
      currentX += 6 // 5 width + 1 space
    }
  }
  
  drawPattern(pattern, x, y, color) {
    for (let py = 0; py < pattern.length; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        if (pattern[py][px] === 1) {
          this.setPixel(x + px, y + py, color)
        }
      }
    }
  }
  
  drawRect(x, y, w, h, color, filled = false) {
    if (filled) {
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          this.setPixel(x + px, y + py, color)
        }
      }
    } else {
      // Top/bottom
      for (let px = 0; px < w; px++) {
        this.setPixel(x + px, y, color)
        this.setPixel(x + px, y + h - 1, color)
      }
      // Left/right
      for (let py = 0; py < h; py++) {
        this.setPixel(x, y + py, color)
        this.setPixel(x + w - 1, y + py, color)
      }
    }
  }
  
  destroy() {
    this.container.destroy()
  }
}

// Simple 5x7 font for dot matrix
const FONT_5X7 = {
  ' ': [
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0]
  ],
  'A': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,0,0,0,0]
  ],
  'B': [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [0,0,0,0,0]
  ],
  'C': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,1],
    [0,1,1,1,0],
    [0,0,0,0,0]
  ],
  '0': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
    [0,0,0,0,0]
  ],
  '1': [
    [0,0,1,0,0],
    [0,1,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,1,1,1,0],
    [0,0,0,0,0]
  ],
  '2': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,1,0,0,0],
    [1,1,1,1,1],
    [0,0,0,0,0]
  ],
  '/': [
    [0,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,1,0,0,0],
    [1,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0]
  ],
  '>': [
    [0,0,0,0,0],
    [0,1,0,0,0],
    [0,0,1,0,0],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,1,0,0,0],
    [0,0,0,0,0]
  ]
}

export default DotMatrix