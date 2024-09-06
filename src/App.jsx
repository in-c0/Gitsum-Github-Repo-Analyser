import Hero from './components/Hero';
import Demo from './components/Demo';
import "preline/preline";
import './App.css';

const App = () => {
    
    // // reinitialize UI components (HSStaticMethods) on route change / page reload
    // const location = useLocation();
    // useEffect(() => {
    //     if (window.HSStaticMethods) {
    //     window.HSStaticMethods.autoInit();
    //     }
    // }, [location.pathname]);

    
    return (
        <main>
            <div className="main">
                <div className="gradient" />
            </div>
            <div className="app">
                <Hero />
                <Demo />
            </div>
        </main>
    )
}

export default App
