const DepthGuage = function(){

    let depth = 17.3
    let unit = "m"

    return(
        <div className="grid grid-row-6 rounded-xl p-3 bg-[#c8d9c3] text-slate-800 dark:bg-teal-900 dark:text-white">
            <span className="text-left text-3xl font-semibold">Depth</span>
            <h1 className="flex row-span-4 items-center justify-center text-9xl font-sans font-bold">{depth}</h1>
            <p className="text-right text-7xl p-3">{unit}</p>
        </div>
    )
}

export default DepthGuage