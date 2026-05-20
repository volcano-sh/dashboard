import {useEffect, useState} from "react"

export const useDebouncedValue = (value, delay = 200) =>{
    const [debouncedValue, setdebouncedValue] = useState(value)

    useEffect(()=>{
        const timeoutId = setTimeout(()=>{
            setdebouncedValue(value)
        },delay)

        return ()=> clearTimeout(timeoutId);
    },[value,delay]);

    return debouncedValue;
};