const Header = () => {
    return(
        <header className="flex flex-row bg-slate-800 items-center justify-between border-r" >
            <div >
                <div className="text-white flex-row flex px-4">
                    <p>Connection Status: </p>
                    <p className="px-2">Kelder Online</p>
                    <p>Full strength</p>
                </div>
            </div>
        </header>
    )
}

export default Header