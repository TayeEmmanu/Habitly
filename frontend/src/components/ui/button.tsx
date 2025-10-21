import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    const classes = [
      "btn",
      variant === "default" && "btn-primary",
      variant === "outline" && "btn-outline",
      variant === "ghost" && "btn-ghost",
      variant === "success" && "btn-success",
      size === "lg" && "btn-lg",
      size === "icon" && "btn-icon",
      className,
    ]
      .filter(Boolean)
      .join(" ")

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, {
        className: classes,
        ref,
        ...props,
      })
    }

    return (
      <button className={classes} ref={ref} {...props}>
        {children}
      </button>
    )
  },
)
Button.displayName = "Button"

export { Button }
