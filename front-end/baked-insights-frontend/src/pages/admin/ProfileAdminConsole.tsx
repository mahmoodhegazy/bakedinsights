import { useEffect, useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { User } from '../../types/index';

export const ProfileAdminConsole: React.FC = () => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [user, setUser] = useState<User>();
    const [newPassword, setNewPassword] = useState("");
    const [retypeNewPassword, setRetypeNewPassword] = useState("");

    const { 
        // Queries
        currentUser,
        isLoadingCurrentUser,

        // Mutations
        updateUser,
    } = useUsers();

    useEffect(() => {
        if (!isLoadingCurrentUser && currentUser) {
            setUser(currentUser);
        }
    }, [currentUser, isLoadingCurrentUser]);

    if (!user || !currentUser) {
        return (
            <>
            <div className="flex grow justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
            </>
        );
    }

    const saveProfile = () => {
        updateUser(user);
    };

    const updatePassword = () => {
        if ((retypeNewPassword == newPassword) && newPassword) {
            updateUser({password: newPassword, ...currentUser});
            setNewPassword("");
            setRetypeNewPassword("");
        }
    };

    return (
    <>
    <div className="mb-4 font-bold text-slate-500 flex-col">
        <h1>My Profile</h1>
    </div>
    <div className="px-8 py-4 border-t border-gray-200 flex flex-row flex-wrap w-full gap-12 mb-4 overflow-auto">
        <div className="flex flex-col gap-3 lg:ml-auto">
            <p className="text-slate-600 text-sm font-bold border-b border-gray-300 py-2">Update Profile</p>
            <div className="min-w-60">
                <label className="block text-gray-400 text-xs font-bold mb-2">Employee-ID</label>
                <input
                    disabled={true}
                    value={user.employee_id}
                    onChange={e => {setUser(prevUser => {
                        if (prevUser) {
                            let newUser = {...prevUser};
                            newUser.employee_id = e.target.value;
                            return newUser;
                        }
                    })}}
                    className={`${false ? "focus:border-sky-300 hover:border-sky-300 text-gray-700" : "text-gray-400 font-medium"} bg-white w-full h-8 px-1 text-sm rounded-md border border-gray-300 outline-none`}
                    type="text"
                />
            </div>
            <div className="min-w-60">
                <label className="block text-gray-400 text-xs font-bold mb-2">Username</label>
                <input
                    disabled={true}
                    value={user.username}
                    onChange={e => {setUser(prevUser => {
                        if (prevUser) {
                            let newUser = {...prevUser};
                            newUser.username = e.target.value;
                            return newUser;
                        }
                    })}}
                    className={`${false ? "focus:border-sky-300 hover:border-sky-300 text-gray-700" : "text-gray-400 font-medium"} bg-white w-full h-8 px-1 text-sm rounded-md border border-gray-300 outline-none`}
                    type="text"
                />
            </div>
            <div className="min-w-60">
                <label className="block text-gray-400 text-xs font-bold mb-2">Name</label>
                <input
                    disabled={true}
                    value={user.name}
                    onChange={e => {setUser(prevUser => {
                        if (prevUser) {
                            let newUser = {...prevUser};
                            newUser.name = e.target.value;
                            return newUser;
                        }
                    })}}
                    className={`${false ? "focus:border-sky-300 hover:border-sky-300 text-gray-700" : "text-gray-400 font-medium"} bg-white w-full h-8 px-1 text-sm rounded-md border border-gray-300 outline-none`}
                    type="text"
                />
            </div>
            <div className="min-w-60">
                <label className="block text-gray-400 text-xs font-bold mb-2">Email</label>
                <input
                    disabled={true}
                    value={user.email}
                    onChange={e => {setUser(prevUser => {
                        if (prevUser) {
                            let newUser = {...prevUser};
                            newUser.email = e.target.value;
                            return newUser;
                        }
                    })}}
                    className={`${false ? "focus:border-sky-300 hover:border-sky-300 text-gray-700" : "text-gray-400 font-medium"} bg-white w-full h-8 px-1 text-sm rounded-md border border-gray-300 outline-none`}
                    type="text"
                />
            </div>
            <div className="min-w-60">
                <label className="block text-gray-400 text-xs font-bold mb-2">Phone</label>
                <input
                    disabled={false}
                    value={user.phone}
                    onChange={e => {setUser(prevUser => {
                        if (prevUser) {
                            let newUser = {...prevUser};
                            newUser.phone = e.target.value;
                            return newUser;
                        }
                    })}}
                    className={`${true ? "focus:border-sky-300 hover:border-sky-300 text-gray-700" : "text-gray-400 font-medium"} bg-white w-full h-8 px-1 text-sm rounded-md border border-gray-300 outline-none`}
                    type="text"
                />
            </div>
            <button
                disabled={user == currentUser}
                type="submit"
                className={`${user == currentUser ? "bg-gray-300 text-white" : "bg-gray-700 hover:bg-gray-900 text-white"} w-full text-left py-2 px-4 border-none outline-none text-sm font-medium rounded-md`}
                onClick={saveProfile}
            >
                Save Profile
            </button>
        </div>
        <div className="flex flex-col gap-3 lg:mr-auto">
            <p className="text-slate-600 text-sm font-bold border-b border-gray-300 py-2">Update Password</p>
            <div className="min-w-60">
                <label className="block text-gray-400 text-xs font-bold mb-2">New Password</label>
                <input
                    disabled={false}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className={`${true ? "focus:border-sky-300 hover:border-sky-300 text-gray-700" : "text-gray-500"} bg-white w-full h-8 px-1 text-sm rounded-md border border-gray-300 outline-none`}
                    type={showPassword ? "text": "password"}
                />
            </div>
            <div className="min-w-60">
                <label className="block text-gray-400 text-xs font-bold mb-2">Retype Password</label>
                <input
                    disabled={false}
                    value={retypeNewPassword}
                    onChange={e => setRetypeNewPassword(e.target.value)}
                    className={`${true ? "focus:border-sky-300 hover:border-sky-300 text-gray-700" : "text-gray-500"} bg-white w-full h-8 px-1 text-sm rounded-md border border-gray-300 outline-none`}
                    type={showPassword ? "text": "password"}
                />
            </div>
            <span className="text-xs text-gray-500">
                <input 
                    checked={showPassword}
                    onChange={(e: any) => {setShowPassword(e.target.checked)}}
                    className="align-middle outline-none mr-1
                                peer relative appearance-none w-3 h-3
                                border rounded-full border-gray-700 
                                cursor-pointer  
                                checked:bg-gray-700"
                    type="checkbox"
                />
                Show Password
            </span>
            {((retypeNewPassword != newPassword) && newPassword) &&
                <div className="text-red-700 font-medium text-xs">
                    Passwords do not match.
                </div>
            }
            <button
                type="submit"
                disabled={(retypeNewPassword != newPassword) || !newPassword}
                className={`${((retypeNewPassword != newPassword) || !newPassword) ? "bg-gray-300 text-white" : "bg-gray-700 hover:bg-gray-900 text-white"} w-full text-left py-2 px-4 border-none outline-none text-sm font-medium rounded-md`}
                onClick={updatePassword}
            >
                Update Password
            </button>
        </div>

    </div>

    </>
  );
}