import React from 'react'

interface ButtonDefaultProps {
  title: string,
  onClick?: () => void;
  customClassname?: string;
  type?: 'button' | 'submit' | 'reset';
  children?: React.ReactNode;
  isDisabled?: boolean;
}

const ButtonDefault = (props: ButtonDefaultProps) => {
    return (
        <button 
            type={props.type || 'button'} 
            onClick={props.onClick}
            className={props.customClassname}
            disabled={props.isDisabled}
        >
            {props.title}
            {props.children}
        </button>
    )
}

export default ButtonDefault
