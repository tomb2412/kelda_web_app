import DepthGuage from "./components/depth";
import WindBarb from "./components/windGraphBarb";
import WindRose from "./components/wind_rose";
import PassagePlan from './components/passagePlan';
import GpsDisplay from "./components/gps";
import FloatingChat from "./components/chatBot";
import { SignedIn } from '@clerk/clerk-react';
import Chart from './components/map';

function App() {
  return (
    <div className='dark:bg-slate-500 bg-white]'>
      <div className='px-3 md:px-5 py-8 gap-4'>
        <div className='flex flex-col sm:grid md:grid-cols-2 lg:grid-cols-3 gap-3'>
          <GpsDisplay />
          <WindRose />
          <DepthGuage />
          <WindBarb />
          <PassagePlan />
          <Chart/>
          <SignedIn>
            <FloatingChat/>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}

export default App
