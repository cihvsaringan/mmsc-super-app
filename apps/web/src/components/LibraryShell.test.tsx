import{cleanup,fireEvent,render,screen}from'@testing-library/react';
import{MemoryRouter,Route,Routes}from'react-router-dom';
import{afterEach,describe,expect,it,vi}from'vitest';
const state=vi.hoisted(()=>({permissions:[]as string[]}));
vi.mock('../auth/AuthContext',()=>({useAuth:()=>({user:{displayName:'Librarian'},logout:vi.fn(),has:(permission:string)=>state.permissions.includes(permission)})}));
vi.mock('./ExperienceSwitcher',()=>({ExperienceSwitcher:()=>null}));
import{LibraryShell}from'./LibraryShell';
const renderShell=()=>render(<MemoryRouter initialEntries={['/library/dashboard']}><Routes><Route path="/library" element={<LibraryShell/>}><Route path="dashboard" element={<h1>Dashboard content</h1>}/></Route></Routes></MemoryRouter>);
describe('Library portal navigation',()=>{afterEach(()=>cleanup());it('filters destinations by granular Library permission',()=>{state.permissions=['library.dashboard.view','library.catalog.view','library.patrons.view'];renderShell();const nav=screen.getByRole('navigation',{name:'Library portal'});expect(nav).toHaveTextContent('Dashboard');expect(nav).toHaveTextContent('Catalog');expect(nav).toHaveTextContent('Patrons');expect(nav).not.toHaveTextContent('Settings');expect(nav).not.toHaveTextContent('Checkout')});it('provides an accessible mobile drawer',()=>{state.permissions=['library.dashboard.view'];renderShell();fireEvent.click(screen.getByRole('button',{name:'Open library navigation'}));const sidebar=screen.getByRole('complementary');expect(sidebar).toHaveClass('library-sidebar--open');fireEvent.click(screen.getByRole('button',{name:'Close library navigation'}));expect(sidebar).not.toHaveClass('library-sidebar--open')})});
