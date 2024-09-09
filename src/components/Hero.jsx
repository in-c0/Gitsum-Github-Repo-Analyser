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
                <span className='orange_gradient '>GITSUM</span> <br></br>
                #Git #Summary #AI <br className='max-md:hidden' />
                
            </h1>
            <h2 className='desc'>
                Git Repo Summariser, Analyser, Chatbot Q&As
            </h2>

        </header>
    );
};

export default Hero;