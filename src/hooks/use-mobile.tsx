import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useDeviceType() {
  const [deviceInfo, setDeviceInfo] = React.useState({
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    isTablet: false,
    touchSupport: false
  })

  React.useEffect(() => {
    const userAgent = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isAndroid = /Android/.test(userAgent)
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT
    const isTablet = window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < 1024
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    setDeviceInfo({
      isIOS,
      isAndroid,
      isMobile,
      isTablet,
      touchSupport
    })
  }, [])

  return deviceInfo
}
