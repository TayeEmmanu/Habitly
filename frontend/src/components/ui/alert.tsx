import * as React from "react"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({ className = "", variant = "default", ...props }, ref) => {
  const classes = ["alert", variant === "destructive" && "alert-error", className].filter(Boolean).join(" ")

  return <div ref={ref} role="alert" className={classes} {...props} />
})
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => <div ref={ref} className={className} {...props} />,
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }
