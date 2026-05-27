// Electron 데스크톱 앱 창을 열고 빌드된 전자북을 로드합니다.
const { app, BrowserWindow } = require('electron')
const path = require('node:path')

const LIVE_APP_URL = 'https://purunet-math-ebook.pages.dev/'

function loadBundledApp(window) {
  return window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 680,
    title: '푸르넷수학 전자북',
    backgroundColor: '#f6fbfb',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  window.loadURL(LIVE_APP_URL).catch(() => loadBundledApp(window))
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
