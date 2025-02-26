'use client'
import {useEffect, useState} from 'react';
import Input from "../componants/input"


export default function Home() {
  const [taskList, setTaskList] = useState([])

  console.log(taskList);
  return (
    <>
      <h1>02- To Do Board</h1>
      <Input taskList={taskList} setTaskList={setTaskList} />
      <div>
        {taskList.map((task) =>
        <li>{task}</li>
        )}
      </div>
    </> 
  );
}
