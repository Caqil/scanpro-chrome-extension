import React, { useState, useEffect } from 'react';

const Tabs = ({ children, defaultValue, className = "", ...props }) => {
  const [value, setValue] = useState(defaultValue);

  // Pass the setValue function to the TabsList to be used by TabsTrigger
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { value, setValue });
    }
    return child;
  });

  return (
    <div className={`w-full ${className}`} {...props}>
      {childrenWithProps}
    </div>
  );
};

const TabsList = ({ children, className = "", value, setValue, ...props }) => {
  // Forward the setValue function to TabsTrigger
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { currentValue: value, setValue });
    }
    return child;
  });

  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground border-b w-full ${className}`} {...props}>
      {childrenWithProps}
    </div>
  );
};

const TabsTrigger = ({ 
  children, 
  value, 
  currentValue, 
  setValue, 
  className = "", 
  ...props 
}) => {
  const isActive = currentValue === value;
  
  return (
    <button
      className={`flex-1 inline-flex items-center justify-center whitespace-nowrap py-1.5 px-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive 
          ? "bg-background text-foreground shadow-sm border-b-2 border-primary" 
          : "text-muted-foreground hover:text-foreground"
      } ${className}`}
      onClick={() => setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ children, value, currentValue, className = "", ...props }) => {
  if (value !== currentValue) return null;
  
  return (
    <div
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };