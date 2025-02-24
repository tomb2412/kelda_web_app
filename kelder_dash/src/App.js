import './App.css';
import {useEffect, useState} from 'react';


function App() {

  // Destructured the return value of useState to time - current state, and setTime which is the function to update time
  const [time, setTime] = useState(0);

  const [running, setRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (running){
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 10);
      },10);
    } else if (!running){
        clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [running]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>A Kelder monitoring service</h1>
        <h2>Time under way</h2>
        <div>
          <span>{("0" + Math.floor((time / 60000) % 60 )).slice(-2)}:</span>
          <span>{("0" + Math.floor((time /1000) % 60)).slice(-2)}:</span>
          <span>{("0" + Math.floor((time /100) % 100)).slice(-2)}</span>
        </div>
        <div>
            {running ? (<button onClick = {()=> { setRunning(false)} }>Stop</button>
        ):(
            <button onClick = {()=> { setRunning(true)} }>Start</button>
            )
        }
            <button onClick = {()=> { setTime(0)}}>Reset</button>
        </div>
      </header>
    </div>
  );
}

export default App;
