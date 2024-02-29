// Navbar.tsx
import React from 'react';
import { TbBellRingingFilled } from 'react-icons/tb';

const Navbar = () => {
    return (
        <nav className="navbar flex-row justify-between bg-green-500 items-center h-20">
            <div className=" ml-16 rounded-full overflow-hidden">
                <a href="/" className=" rounded-full">
                    <picture className="flex">
                        <img
                            src="next.svg"
                            alt="Landscape picture"
                            className="w-20 h-20 object-cover border-4 border-white rounded-xl"
                        />
                    </picture>
                </a>
            </div>

            <div className="flex items-center p-2  bg-white rounded-xl shadow-sm ">
                <input
                    className="bg-gray-100 w-80  h-8 text-gray-900 ring-0 "
                    type="text"
                    placeholder="Article name or keyword..."
                />
                <div className="bg-green-400 ml-3 py-3 px-5 text-gray-900 font-semibold rounded-lg hover:shadow-lg transition duration-3000 cursor-pointer">
                    <span>Search</span>
                </div>
            </div>

            <div className="user-actions space-x-4 mr-16">
                <a href="/login" className="text-white" ><button type="button" className="mb-2">
                    เข้าสู่ระบบ
                </button></a>
                <a href="/register" className="text-white" ><button type="button" className="mb-2">
                    สมัครสมาชิก
                </button></a>

                <button type="button" className="mb-2 w-10 h-10">
                    <TbBellRingingFilled className="text-2xl" />
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
