import { ClassType } from "@/utils/classUtils";

interface TabProps {
   current: ClassType;
}

function PeopleTab({ current }: TabProps) {
   // Group members into teachers and students
   const teachers = current.members.filter(
      (member) => member.role === "Teacher"
   );
   const students = current.members.filter(
      (member) => member.role === "Student"
   );


return (
   <div className="flex flex-col items-center justify-center p-8">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-2xl">
         
         {/* Teachers Section */}
         <div className="border-b border-gray-300 pb-2 mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Teachers</h2>
         </div>
         <ul className="mb-6">
            {teachers.map((teacher) => (
               <li key={teacher.user_id} className="flex items-center space-x-4 py-2">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full text-xl font-bold text-white bg-blue-600 object-cover">
                     {teacher.user?.username.charAt(0).toUpperCase()}
                  </div>    
                  <span className="text-lg font-medium text-gray-800">{teacher.user?.username}</span>
               </li>
            ))}
         </ul>

         {/* Classmates Section */}
         <div className="border-b border-gray-300 pb-2 mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Classmates</h2>
            <span className="text-gray-500 text-sm">{students.length} students</span>
         </div>
         <ul>
            {students.map((student, index) => (
               <li key={student.user_id} className="flex items-center space-x-4 py-3">
               <div className="w-10 h-10 flex items-center justify-center rounded-full text-xl font-bold text-white bg-blue-600">
                  {student.user?.username.charAt(0).toUpperCase()}
               </div>                  
               <span className="text-lg font-medium text-gray-800">{student.user?.username}</span>
               {/* {index < students.length - 1 && <hr className="w-full border-gray-300" />} Gray line between students */}
               </li>
            ))}
         </ul>
      </div>
   </div>

);

}

export default PeopleTab;
