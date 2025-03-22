'use client'
import {useState} from 'react';


const Input = function({taskList, setTaskList}){
    const [input, setInput] = useState("")

    const handleAddTask = (e) => {
        e.preventDefault();
        setTaskList([...taskList, input]);
        setInput("");
    }
    
    console.log(input);

    return (
        <div>
            <form className='flex flex-row items-center gap-3'>
                <input
                className='border rounded py-1.5 px-2.5 text-lg'
                type="text"
                placeholder="Add a task"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                />
                <button 
                    className='bg-violet-500 text-white py-1 px-3.5 rounded font-semibold hover:opacity-90'
                onClick={handleAddTask}>Add</button>
            </form>
        </div>
    )
}

export default Input