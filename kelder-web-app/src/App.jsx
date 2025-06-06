'use client'
import {useState} from 'react';
import Input from "./componants/input";
import Board from "./componants/board";
import DepthGuage from "./componants/depth";
import WindBarb from "./componants/windGraphBarb";
import Guage from "./componants/gauge";
import WindRose from "./componants/wind_rose";
import BilgeDepth from './componants/bilgeDepth';
import GpsDisplay from "./componants/gps";
import Log from './componants/log';

function App() {
  const [taskList, setTaskList] = useState([]);

  console.log(taskList);
  return (
    <div className='dark:bg-slate-900 bg-white]'>
        <div className='px-3 md:px-5 py-8 gap-4 '>
        {/* <div className='flex flex-col items-center justify-center py-8 gap-4'>
          <h1 className='text-xl font-semibold'>02- To Do Board</h1>
          <Input taskList={taskList} setTaskList={setTaskList} />
        </div>   */}
        <div className='flex flex-col sm:grid md:grid-cols-2 lg:grid-cols-3 gap-3'>
          <GpsDisplay />
          <WindRose />
          <DepthGuage />
          {/* <Log /> */}
          <Guage />
          <WindBarb />
          <BilgeDepth />
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
    </div>
  );
}

export default App
