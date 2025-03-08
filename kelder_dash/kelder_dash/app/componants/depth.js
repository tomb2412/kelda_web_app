

const DepthGuage = function(){

    let depth = 17.3
    let unit = "m"

    return(
        <div className="grid grid-row-6 border rounded-xl p-3">
            <p className="text-left text-3xl">Depth</p>
            <h1 className="flex row-span-4 items-center justify-center text-9xl font-sans font-semibold">{depth}</h1>
            <p className="text-right text-7xl p-3">{unit}</p>
        </div>
    )
}

export default DepthGuage