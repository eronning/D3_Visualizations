import operator,sys
from datetime import datetime
#init(dict count_mat) takes in an empty dictionary
#and initializes every (day,hour) pair to zero
def init(count_mat):
    count_mat = {} #dictionary mapping tuples (day, hour) to counts of crime
    for day in range(7): #days of week
    	for h in range(24): #hours of day
    		count_mat[(day+1, h+1)] = 0
    return count_mat

def count_crime(data, count_mat):
    """This method parses crime dataset and derives the count of crime
    sent at various day,hour pairs.
    Input: file containing crime data in CSV format.
    Hint : Use the Python datetime module 
    """
    readFirstLine = False
    for line in data:
        if readFirstLine:
            line = line.split(',')
            timing = datetime.strptime(line[2], "%m/%d/%Y %I:%M:%S %p")
            count_mat[(timing.weekday() + 1,timing.hour + 1)] += 1
        else:
            readFirstLine = True
    return count_mat


def main():
    data = open(sys.argv[1], 'r') 
    count_mat = init({})
    # print(count_mat)
    count_mat = count_crime(data, count_mat)

    out = open(sys.argv[2], 'w')
    out.write("day\thour\tvalue\n")
    
    #sort by day, hour (ascending)
    sorted_counts = sorted(count_mat.items(), key=operator.itemgetter(0))
    for (x, y) in sorted_counts:
        out.write(str(x[0])+"\t"+str(x[1])+'\t'+str(y)+"\n")
    out.close()

if __name__ == '__main__':
    main()