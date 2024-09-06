import { logo } from "../assets";

const Hero = () => {
    return (
        <header className='w-full flex justify-center items-center flex-col'>
            <nav className='flex justify-between items-center w-full mb-10 pt-3'>
                <img src={logo} alt='sumz_logo' className='w-28 object-contain' />

                <button
                    type='button'
                    onClick={() =>
                        window.open("https://github.com/in-c0/GRAKKEN-Github-Repo-Analyser", "_blank")
                    }
                    className='black_btn'
                >
                    GitHub
                </button>
            </nav>

            <h1 className='head_text'>
                Unlock GitHub insights with <br className='max-md:hidden' />
                <span className='orange_gradient '>GRAKKEN</span>
            </h1>
            <h2 className='desc'>
                Analyze, summarize, and optimize repositories
            </h2>

        </header>
    );
};

export default Hero;