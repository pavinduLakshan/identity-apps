import './App.css'
import { PageLayout } from "@wso2is/react-components";

function App() {

  return (
    <PageLayout
            pageTitle="Applications"
            title={ "Dashboard" }
            description={ "Configure application dashboard settings" }
        >
          <button>configure</button>
        </PageLayout>
  )
}

export default App
