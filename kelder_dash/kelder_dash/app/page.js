'use client'
import {useState} from 'react';
import Input from "../app/componants/input"
import Board from "./componants/board"
import WindGraph from "./componants/graph"
import WindData from "./assets/wind_data"

export default function Home() {
  const [taskList, setTaskList] = useState([]);

  console.log(taskList);
  return (
    <div className='px-12'>
      <div className='flex flex-col items-center justify-center py-8 gap-4'>
        <h1 className='text-xl font-semibold'>02- To Do Board</h1>
        <Input taskList={taskList} setTaskList={setTaskList} />
      </div>  
      <div className='flex flex-col sm:grid md:grid-cols-2 lg:grid-cols-3 px-3 sm:px-8 md:px-10 lg:px-6 gap-3'>
        <WindGraph data={WindData()}/>
        <WindGraph data={WindData()}/>
        <WindGraph data={WindData()}/>
        <WindGraph data={WindData()}/>
        <WindGraph data={WindData()}/>
        <WindGraph data={WindData()}/>
      </div>
 
      <div className='flex flex-col gap-4 sm:grid grid-cols-3 py-3 px-3 sm:px-8 md:px-10 lg:px-12'>
        {taskList.map((task, index) =>
          <Board 
            key={index}
            index={index}
            task={task}
            taskList={taskList}
            setTaskList={setTaskList}
          /> 
        )}
      </div>
      
    </div>
  );
}
