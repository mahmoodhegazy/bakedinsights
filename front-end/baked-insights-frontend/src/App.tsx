import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { PrivateLayout } from './layouts/PrivateLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './pages/Login';
import { ContentLayout } from './layouts/ContentLayout';
import { UserAdminConsole } from './pages/admin/UserAdminConsole';
import { ProfileAdminConsole } from './pages/admin/ProfileAdminConsole';
import { Tables } from './pages/tables/Tables';
import { TableDetails } from './pages/tables/TableDetails';
import { Checklists } from './pages/checklists/Checklists';
import { ChecklistTemplateDetails } from './pages/checklists/ChecklistTemplateDetails';
import { ChecklistDetails } from './pages/checklists/ChecklistDetails';

const queryClient = new QueryClient();
const orgName = "PickMeUp"


function App() {

  const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path='/' element={<MainLayout />}>

        {/* Login Page */}
        <Route path='/login' element={<Login />} />

        {/* Private Pages (must be logged in) */}
        <Route path='/' element={<PrivateLayout orgName={orgName} />}>

            {/* Admin routes */}
            <Route path='/admin' element={<ContentLayout />}>
                <Route path='/admin/users' element={<UserAdminConsole />} />
                <Route path='/admin/profile' element={<ProfileAdminConsole />} />
            </Route>

            {/* Content routes */}
            <Route path='/' element={<ContentLayout />}>

                <Route index element={<Tables />} />

                {/* Table routes */}
                <Route path='/tables' element={<Tables />}/>
                <Route path='/tables/:id' element={<TableDetails />}/>

                {/* Checklists routes */}
                <Route path='/checklists' element={<Checklists />} />
                <Route path='/checklists/templates/:id' element={<ChecklistTemplateDetails />} />
                <Route path='/checklists/templates/:id/checklist/:cid' element={<ChecklistDetails />} />

            </Route>

        </Route>
      </Route>
    )
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />;
    </QueryClientProvider>
  );
}

export default App;