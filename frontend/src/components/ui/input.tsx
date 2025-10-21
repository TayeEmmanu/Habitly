import * as React from "react"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className = "", ...props }, ref) => {
  return <input className={`input ${className}`} ref={ref} {...props} />
})
Input.displayName = "Input"

export { Input }
