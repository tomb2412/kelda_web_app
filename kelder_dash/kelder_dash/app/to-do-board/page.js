'use client'
import {useEffect, useState} from 'react';
import Input from "../componants/input"


export default function Home() {
  const [taskList, setTaskList] = useState([])

  console.log(taskList);
  return (
    <div className='flex flex-col items-center justify-center py-8 gap-4'>
      <h1 className='text-xl font-semibold'>02- To Do Board</h1>
      <Input taskList={taskList} setTaskList={setTaskList} />
      <div>
        {taskList.map((task) =>
        <li>{task}</li>
        )}
      </div>
    </div> 
  );
}
