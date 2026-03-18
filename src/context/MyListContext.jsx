import React from 'react';

const MyListContext = React.createContext();

export function MyListProvider({ children }) {
  const [myList, setMyList] = React.useState(() => {
    try {
      const saved = localStorage.getItem('myList');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });

  React.useEffect(() => {
    localStorage.setItem('myList', JSON.stringify(myList));
  }, [myList]);

  const isInMyList = (id) => myList.some(item => item.id === id);

  const toggleMyList = (item) => {
    setMyList(prevList => {
      if (isInMyList(item.id)) {
        return prevList.filter(i => i.id !== item.id);
      } else {
        return [item, ...prevList];
      }
    });
  };

  return (
    <MyListContext.Provider value={{ myList, toggleMyList, isInMyList }}>
      {children}
    </MyListContext.Provider>
  );
}

export const useMyList = () => React.useContext(MyListContext);
