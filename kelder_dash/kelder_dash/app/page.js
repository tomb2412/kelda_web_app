'use client'
import {useState} from 'react';
import Input from "../app/componants/input"
import Board from "./componants/board"
import Graph from "./componants/graph"

export default function Home() {
  const [taskList, setTaskList] = useState([]);

  const data = [
  { year: 2010, low: 10 , high: 123 },
  { year: 2011, low: 40 , high: 637 },
  { year: 2012, low: 55 , high: 379 },
  { year: 2013, low: 25 , high: 947 },
  { year: 2014, low: 22 , high: 312 },
  { year: 2015, low: 90 , high: 481 },
  { year: 2016, low: 28 , high: 323 },
  { year: 2010, low: 74 , high: 130 },
  { year: 2011, low: 24 , high: 240 },
  { year: 2012, low: 92 , high: 515 },
  { year: 2013, low: 22 , high: 265 },
  { year: 2014, low: 21 , high: 282 },
  { year: 2015, low: 21 , high: 390 },
  { year: 2016, low: 27 , high: 298 },
  ];


  console.log(taskList);
  return (
    <div className='px-12'>
      <div className='flex flex-col items-center justify-center py-8 gap-4'>
        <h1 className='text-xl font-semibold'>02- To Do Board</h1>
        <Input taskList={taskList} setTaskList={setTaskList} />
      </div>  
      <div className='flex flex-col items-cente sm:grid grid-cols-2 py-8 px-10 gap-20'>
        <Graph data={data}/>
        <Graph data={data}/>
      </div>
 
      <div className='flex flex-col gap-4 sm:grid grid-cols-3 px-3 sm:px-8 md:px-10 lg:px-12'>
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
