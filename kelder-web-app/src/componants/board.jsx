import Timer from "./timer"

const Board = function({task,index,taskList, setTaskList}){

     const  handleDelete = () => {
        let removeIndex = task.indexOf(task);
        taskList.splice(removeIndex, 1);
        setTaskList((currentTasks => currentTasks.filter(todo => index === // eslint-disable-line
            removeIndex)));
     }

    return (
        <>
            <div className="max-w-md rounded-xl flex flex-col items-center justify-start border text-center text-lg pt-2 pb-3 md:px-5">
                <p>{task}</p>
                <Timer />
                <button className="bg-red-500 text-white rounded-lg py-1 px-3 mt-4"
                onClick={handleDelete}>
                    Delete
                </button>
            </div>
        </>
    )
}

export default Board;