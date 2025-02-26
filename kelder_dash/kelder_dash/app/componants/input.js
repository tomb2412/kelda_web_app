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
            <form>
                <input
                className='border rounded px-2'
                type="text"
                placeholder="Add a task"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                />
                <button onClick={handleAddTask}>Add</button>
            </form>
        </div>
        
    )
}

export default Input