const kHeaderHeight = 64
const kSidebarWidth = 280

const kStorageConfigPrefix = 'aibrow-demo-config-'
const kStorageStatePrefix = 'aibrow-demo-state-'

const kAiBrowIconPath = [
  ...new URL('http://localhost:8080/demos/aibrow-demo-page.js').pathname.split('/').slice(0, -1),
  'icon.png'
].join('/')
const kGithubUrl = `https://github.com/axonzeta/aibrow-demos/blob/main/${window.location.pathname.replace(/^\/|\/$/g, '')}/index.html`

const kModels = [
  ['phi-3-5-mini-instruct-q4-k-m', 'AiBrow Phi 3.5 Mini Instruct Q4_K_M'],
  ['qwen2-5-1-5b-instruct-q4-k-m', 'AiBrow Qwen2.5 1.5b Instruct Q4_K_M'],
  ['gemma-2-2b-instruct-q4-k-m', 'AiBrow Gemma 2 2b Instruct Q4_K_M'],
  ['gemma-2b-instruct-q4-k-m', 'AiBrow Gemma 2b Instruct Q4_K_M'],
  ['qwen2-5-coder-1-5b-instruct-q4-k-m', 'AiBrow Qwen2.5 Coder 1.5B Instruct Q4_K_M'],
  ['llama-3-2-1b-instruct-q4-k-m', 'AiBrow Llama 3.2 1B Instruct Q4_K_M'],
  ['llama-3-2-3b-instruct-q4-k-m', 'AiBrow Llama 3.2 3B Instruct Q4_K_M'],
  ['smollm2-360m-instruct-q4-k-m', 'AiBrow SmolLM2 360M Instruct Q4_K_M'],
  ['smollm2-1-7b-instruct-q4-k-m', 'AiBrow SmolLM2 1.7B Instruct Q4_K_M']
]

window.aibrowDemo = {
  spec: {}, // demo spec (i.e. what's supported)
  props: {}, // user props (i.e. which model to use, persisted, url params)
  state: {} // internal state (i.e. sidebar visibility, persisted)
}

/* **************************************************************************/
// MARK: Spec
/* **************************************************************************/

// Parse any spec from the header
// <meta name="demo-spec" content="supportsBrowserAI=false" />
{
  const defaultSpec = {
    supportsBrowserAI: true
  }
  const $spec = document.querySelector('meta[name="demo-spec"]')
  const spec = $spec ? new URLSearchParams($spec.content) : new URLSearchParams()
  window.aibrowDemo.spec = Object.entries(defaultSpec).reduce((acc, [key, value]) => {
    const userVal = spec.get(key)
    if (userVal) {
      if (typeof (value) === 'boolean') {
        acc[key] = userVal === 'true'
      } else {
        acc[key] = userVal
      }
    } else {
      acc[key] = value
    }
    return acc
  }, {})
}

/* **************************************************************************/
// MARK: Props
/* **************************************************************************/

// Parse the props
{
  const defaultProps = {
    aibrowModel: undefined,
    browserAI: false
  }
  const query = new URLSearchParams(window.location.search)
  window.aibrowDemo.props = Object.entries(defaultProps).reduce((acc, [key, value]) => {
    if (typeof (value) === 'boolean') {
      const userVal = query.get(key) || window.localStorage.getItem(`${kStorageConfigPrefix}${key}`)
      acc[key] = userVal
        ? userVal === 'true'
        : value
    } else {
      acc[key] = query.get(key) || window.localStorage.getItem(`${kStorageConfigPrefix}${key}`) || value
    }
    return acc
  }, {})

  // Make sure the config complies with the spec
  if (window.aibrowDemo.spec.supportsBrowserAI === false) {
    if (window.aibrowDemo.props.browserAI) {
      updateConfig({ browserAI: false, aibrowModel: undefined })
    }
  }
}

/**
 * Sets config values and reloads the page
 * @param update: an object with the updated key values
 */
function updateConfig (update) {
  const query = new URLSearchParams(window.location.search)

  const nextProps = { ...window.aibrowDemo.props }
  for (const [key, value] of Object.entries(update)) {
    if (value === undefined || value === null) {
      localStorage.removeItem(`${kStorageConfigPrefix}${key}`, value)
      query.delete(key)
      delete nextProps[key]
    } else {
      localStorage.setItem(`${kStorageConfigPrefix}${key}`, value)
      query.set(key, value)
      nextProps[key] = value
    }
  }
  window.aibrowDemo.props = nextProps
  window.location.href = `${window.location.pathname}?${query.toString()}`
}

/* **************************************************************************/
// MARK: State
/* **************************************************************************/

window.aibrowDemo.state = {
  sidebar: !window.localStorage.getItem(`${kStorageStatePrefix}sidebar`) || window.localStorage.getItem(`${kStorageStatePrefix}sidebar`) === JSON.stringify(true)
}

/**
 * Sets state values
 * @param update: an object with the updated key values
 */
function updateState (update) {
  for (const [key, value] of Object.entries(update)) {
    if (value === undefined || value === null) {
      localStorage.removeItem(`${kStorageStatePrefix}${key}`, value)
      delete window.aibrowDemo.state[key]
    } else {
      localStorage.setItem(`${kStorageStatePrefix}${key}`, JSON.stringify(value))
      window.aibrowDemo.state[key] = value
    }
  }
}

/* **************************************************************************/
// MARK: Page
/* **************************************************************************/

/**
 * Updates the favicon of the page
 */
function updatePageFavicon () {
  const $link = document.createElement('link')
  $link.rel = 'icon'
  $link.href = kAiBrowIconPath
  document.head.appendChild($link)
}

/* **************************************************************************/
// MARK: Rendering
/* **************************************************************************/

/**
 * Updates the sidebar visibility
 */
function updateSidebarVisibility () {
  const $main = document.querySelector('[data-demo="main"]')
  const $sidebar = document.querySelector('[data-demo="sidebar"]')

  if (window.aibrowDemo.state.sidebar) {
    $main.style.left = `${kSidebarWidth}px`
    $sidebar.style.left = '0px'
  } else {
    $main.style.left = '0px'
    $sidebar.style.left = `${-kSidebarWidth}px`
  }
}

/**
 * Creates the page UI from the content of what's in the index
 */
function renderUI () {
  const $infoTemplate = document.querySelector('[data-demo="info"]')
  const $main = document.querySelector('[data-demo="main"]')

  // Render the header
  const $headerTemplate = document.createElement('template')
  $headerTemplate.innerHTML = `
<header class="flex items-center justify-between p-4 bg-gray-900 text-white" style="position: fixed; inset: 0 0 auto 0; height: ${kHeaderHeight}px;" data-demo="header">
  <div class="flex items-center">
    <span class="flex mr-3 cursor-pointer items-center text-sm font-medium text-gray-300 hover:text-white" data-demo-hook="sidebar-toggle-button">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-current" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    </span>
    <a href="https://demo.aibrow.ai" class="flex items-center space-x-2">
      <img src="${kAiBrowIconPath}" alt="Logo" class="w-8 h-8">
      <span class="text-lg font-semibold">AiBrow Demos</span>
    </a>

    <span class="ml-6 text-sm font-medium text-gray-300">
      ${document.title}
    </span>
  </div>

  <a href="${kGithubUrl}" title="View on GitHub" class="flex items-center text-sm font-medium text-gray-300 hover:text-white">
    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-current" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2c-5.523 0-10 4.477-10 10a9.994 9.994 0 007.164 9.542c.524.095.714-.227.714-.505v-1.764c-2.908.635-3.523-1.41-3.523-1.41-.477-1.21-1.165-1.532-1.165-1.532-.952-.652.072-.639.072-.639 1.054.074 1.607 1.083 1.607 1.083.934 1.6 2.448 1.13 3.043.865.094-.676.363-1.13.66-1.39-2.32-.264-4.763-1.157-4.763-5.152 0-1.138.405-2.069 1.07-2.796-.107-.263-.465-1.321.102-2.75 0 0 .877-.28 2.874 1.064a9.968 9.968 0 015.23 0c1.997-1.344 2.873-1.064 2.873-1.064.567 1.429.21 2.487.103 2.75.666.727 1.07 1.658 1.07 2.796 0 3.998-2.446 4.884-4.772 5.145.373.32.707.812.707 1.653v2.447c0 .28.19.603.717.503A10 10 0 0022 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  </a>
</header>`.trim()
  $headerTemplate.content.querySelector('[data-demo-hook="sidebar-toggle-button"]').addEventListener('click', (evt) => {
    evt.preventDefault()
    updateState({ sidebar: !window.aibrowDemo.state.sidebar })
    updateSidebarVisibility()
  })
  document.body.prepend($headerTemplate.content.firstChild)

  // Render the sidebar
  const $sidebarTemplate = document.createElement('template')
  $sidebarTemplate.innerHTML = `
<nav class="flex flex-1 px-2 py-2 flex-col bg-gray-900 text-white transition-all overflow-auto" style="position: fixed; inset: ${kHeaderHeight}px auto 0 0; width: ${kSidebarWidth}px;" data-demo="sidebar">
  <div class="text-xs/6 font-semibold text-amber-400">Demo info</div>
  <div data-demo-hook="info" class="text-sm"></div>

  <div class="mt-3">
    <label class="block text-xs/6 font-semibold text-amber-400">Model</label>
    <select data-demo-hook="sidebar-model-select" class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-amber-600 sm:text-sm/6">
      <option value="__browser__" ${window.aibrowDemo.props.browserAI ? 'selected' : ''} ${window.aibrowDemo.spec.supportsBrowserAI === false ? 'disabled' : ''}>
        Browser AI ${window.aibrowDemo.spec.supportsBrowserAI === false ? ' (Not supported)' : ''}
      </option>
      <option value="__aibrow__" ${!window.aibrowDemo.props.browserAI && !window.aibrowDemo.props.aibrowModel ? 'selected' : ''}>AiBrow AI</option>
      <option disabled>──────────</option>
      ${kModels.map(([value, label]) => `<option value="${value}" ${!window.aibrowDemo.props.browserAI && value === window.aibrowDemo.props.aibrowModel ? 'selected' : ''}>${label}</option>`).join('')}
    </select>
  </div>
</nav>
  `.trim()
  const $info = $infoTemplate.content.cloneNode(true)
  for (const $el of $info.querySelectorAll('p')) {
    $el.classList.add('mt-3')
  }
  for (const $el of $info.querySelectorAll('a')) {
    $el.classList.add('text-underline', 'text-amber-200', 'hover:text-amber-400')
  }
  $sidebarTemplate.content.querySelector('[data-demo-hook="info"]').appendChild($info)
  $sidebarTemplate.content.querySelector('[data-demo-hook="sidebar-model-select"]').addEventListener('change', (evt) => {
    switch (evt.target.value) {
      case '__browser__':
        updateConfig({ browserAI: true, aibrowModel: undefined })
        break
      case '__aibrow__':
        updateConfig({ browserAI: false, aibrowModel: undefined })
        break
      default:
        updateConfig({ browserAI: false, aibrowModel: evt.target.value })
        break
    }
  })
  document.body.prepend($sidebarTemplate.content.firstChild)

  // Restyle the main content
  $main.style.position = 'fixed'
  $main.style.inset = `${kHeaderHeight}px 0 0 ${kSidebarWidth}px`
  $main.classList.add('transition-all')

  updateSidebarVisibility()
}

/* **************************************************************************/
// MARK: Environment
/* **************************************************************************/

/**
 * Checks that the environment is setup for our current config
 */
async function checkEnvironmentIsSetup () {
  if (window.aibrowDemo.props.browserAI) {
    if (
      !window.ai ||
      !window.ai.languageModel ||
      !window.ai.summarizer ||
      !window.ai.writer ||
      !window.ai.rewriter ||
      !window.ai.translator ||
      window.ai.aibrow === true
    ) {
      const $template = document.createElement('template')
      $template.innerHTML = `
  <div class="relative z-10" role="dialog">
    <div class="fixed inset-0 bg-gray-500/75 transition-opacity"></div>

    <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-lg bg-slate-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
          <div>
            <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-5">
              <h3 class="text-base font-semibold text-white">Enable the Gemini Nano browser APIs</h3>
              <div class="mt-2">
                <p class="text-sm text-gray-200">
                  To use this demo, you need enable the following browser flags:
                  <ul class="list-decimal list-inside text-gray-200 text-sm text-left mt-2">
                    <li>chrome://flags/#prompt-api-for-gemini-nano</li>
                    <li>chrome://flags/#summarization-api-for-gemini-nano</li>
                    <li>chrome://flags/#writer-api-for-gemini-nano</li>
                    <li>chrome://flags/#rewriter-api-for-gemini-nano</li>
                    <li>chrome://flags/#translation-api</li>
                  </ul>
                </p>
              </div>
            </div>
          </div>
          <div class="mt-5 sm:mt-6">
            <a href="${window.location.href}" class="inline-flex w-full justify-center rounded-md bg-amber-400 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
              Reload
            </a>
            <button type="button" data-demo-hook="dialog-close" class="mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:bg-opacity-15">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`.trim()
      const $dialog = $template.content.firstChild
      $dialog.querySelector('[data-demo-hook="dialog-close"]').addEventListener('click', (evt) => {
        evt.preventDefault()
        $dialog.remove()
      })
      document.body.prepend($dialog)
    }
  } else {
    if (!window.aibrow) {
      const $template = document.createElement('template')
      $template.innerHTML = `
  <div class="relative z-10" role="dialog">
    <div class="fixed inset-0 bg-gray-500/75 transition-opacity"></div>

    <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-lg bg-slate-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
          <div>
            <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-5">
              <h3 class="text-base font-semibold text-white">Install the AiBrow extension</h3>
              <div class="mt-2">
                <p class="text-sm text-gray-200">
                  To use this demo, you need to AiBrow extension installed in your browser.
                </p>
              </div>
            </div>
          </div>
          <div class="mt-5 sm:mt-6">
            <a href="https://chromewebstore.google.com/detail/aibrow/bbkbjiehfkggfkbampigbbakecijicdm" class="inline-flex w-full justify-center rounded-md bg-amber-400 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
              Install from the Chrome store
            </a>
            <button type="button" data-demo-hook="dialog-close" class="mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:bg-opacity-15">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`.trim()
      const $dialog = $template.content.firstChild
      $dialog.querySelector('[data-demo-hook="dialog-close"]').addEventListener('click', (evt) => {
        evt.preventDefault()
        $dialog.remove()
      })
      document.body.prepend($dialog)
    } else {
      const { helper } = await window.aibrow.capabilities()
      if (!helper) {
        const $template = document.createElement('template')
        $template.innerHTML = `
  <div class="relative z-10" role="dialog">
    <div class="fixed inset-0 bg-gray-500/75 transition-opacity"></div>

    <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-lg bg-slate-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
          <div>
            <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>

            </div>
            <div class="mt-3 text-center sm:mt-5">
              <h3 class="text-base font-semibold text-white">Install the AiBrow helper</h3>
              <div class="mt-2">
                <p class="text-sm text-gray-200">
                  To use this demo, you need to have the AiBrow extension helper installed.
                </p>
              </div>
            </div>
          </div>
          <div class="mt-5 sm:mt-6">
            <a href="https://aibrow.ai/install" class="inline-flex w-full justify-center rounded-md bg-amber-400 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
              Download the AiBrow helper
            </a>
            <button type="button" data-demo-hook="dialog-close" class="mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:bg-opacity-15">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`.trim()
        const $dialog = $template.content.firstChild
        $dialog.querySelector('[data-demo-hook="dialog-close"]').addEventListener('click', (evt) => {
          evt.preventDefault()
          $dialog.remove()
        })
        document.body.prepend($dialog)
      }
    }
  }
}

/* **************************************************************************/
// MARK: Main
/* **************************************************************************/

function main () {
  updatePageFavicon()
  renderUI()
  checkEnvironmentIsSetup()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main)
} else {
  main()
}
